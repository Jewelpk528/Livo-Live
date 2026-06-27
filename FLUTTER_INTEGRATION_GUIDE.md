# Flutter Real-Time Voice & Video Call Integration Guide

This integration guide explains how to implement secure, 1-on-1 real-time voice and video calling with Firebase Firestore persistence and Agora / ZEGOCLOUD SDKs in a Flutter application.

---

## 1. Native Device Permissions Setup

### Android Setup (`android/app/src/main/AndroidManifest.xml`)

Add the following permissions inside the `<manifest>` tag:

```xml
<!-- Internet Access for RTC Connections -->
<uses-permission android:name="android.permission.INTERNET" />

<!-- Camera & Audio Permissions -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

<!-- Bluetooth for wireless headset calling (Android 12+) -->
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
```

### iOS Setup (`ios/Runner/Info.plist`)

Add user usage descriptions inside the `<dict>` tag:

```xml
<key>NSCameraUsageDescription</key>
<string>Livo Live requires secure camera access to enable premium 1-on-1 video call features with live hosts.</string>
<key>NSMicrophoneUsageDescription</key>
<string>Livo Live requires secure microphone access to transmit your voice during live voice and video streaming sessions.</string>
```

---

## 2. Flutter Dependency Configuration (`pubspec.yaml`)

Add the required packages for permission handling, Firestore integration, and real-time audio/video streaming:

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # Permission and Device Settings Handler
  permission_handler: ^11.3.1
  
  # Firebase Core and Cloud Firestore
  firebase_core: ^2.27.0
  cloud_firestore: ^4.15.5

  # Real-time Communication SDKs (Choose one)
  agora_rtc_engine: ^6.3.0
  # or zego_express_engine: ^3.10.0
```

---

## 3. Secure Permissions Manager (`permissions_service.dart`)

This service handles checking and requesting camera and microphone access, presenting intuitive custom dialogs if denied, and launching the native OS Device Settings if permanently blocked.

```dart
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

class CallPermissionsService {
  /// Request Camera and Microphone access for Voice or Video calls
  static Future<bool> requestCallPermissions({
    required BuildContext context,
    required bool isVideoCall,
  }) async {
    // 1. Microphone is required for both voice and video sessions
    PermissionStatus micStatus = await Permission.microphone.status;
    PermissionStatus cameraStatus = isVideoCall 
        ? await Permission.camera.status 
        : PermissionStatus.granted;

    if (micStatus.isGranted && cameraStatus.isGranted) {
      return true;
    }

    // 2. Request outstanding permissions
    Map<Permission, PermissionStatus> statuses = await [
      Permission.microphone,
      if (isVideoCall) Permission.camera,
    ].request();

    micStatus = statuses[Permission.microphone] ?? micStatus;
    if (isVideoCall) {
      cameraStatus = statuses[Permission.camera] ?? cameraStatus;
    }

    // 3. Permission granted!
    if (micStatus.isGranted && cameraStatus.isGranted) {
      return true;
    }

    // 4. Handle permanently denied or standard denial cases
    if (micStatus.isPermanentlyDenied || cameraStatus.isPermanentlyDenied) {
      _showPermanentlyDeniedDialog(context);
    } else {
      _showPermissionDeniedDialog(context, isVideoCall);
    }

    return false;
  }

  /// Dialog shown for standard denials, giving the user an option to retry
  static void _showPermissionDeniedDialog(BuildContext context, bool isVideo) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Device Access Required'),
        content: Text(
          isVideo
              ? 'To start a 1-to-1 video session with this host, Livo Live requires camera and microphone permissions.'
              : 'To start a 1-to-1 voice session with this host, Livo Live requires microphone permission.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              requestCallPermissions(context: context, isVideoCall: isVideo);
            },
            child: const Text('Grant Access'),
          ),
        ],
      ),
    );
  }

  /// Dialog shown when permissions are permanently blocked, redirecting them to settings
  static void _showPermanentlyDeniedDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Permissions Blocked'),
        content: const Text(
          'Livo Live cannot access your camera or microphone because it was permanently denied. Please open your device App Settings to enable access manually.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(context).pop();
              await openAppSettings();
            },
            child: const Text('Open App Settings'),
          ),
        ],
      ),
    );
  }
}
```

---

## 4. Live Agora Call Connection Flow (`call_session_widget.dart`)

The screen manages:
1. Creating/Initializing the Agora engine
2. Showing local camera preview before connection
3. Toggling microphone, speaker, and camera state
4. Flipping between Front/Rear camera facing mode
5. Ensuring tracks are fully closed and released when ending a call

```dart
import 'package:flutter/material.dart';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class AgoraCallSessionWidget extends StatefulWidget {
  final String callId;
  final String callerId;
  final String receiverId;
  final String receiverName;
  final bool isVideoCall;
  final int coinRatePerMinute;

  const AgoraCallSessionWidget({
    Key? key,
    required this.callId,
    required this.callerId,
    required this.receiverId,
    required this.receiverName,
    required this.isVideoCall,
    required this.coinRatePerMinute,
  }) : super(key: key);

  @override
  State<AgoraCallSessionWidget> createState() => _AgoraCallSessionWidgetState();
}

class _AgoraCallSessionWidgetState extends State<AgoraCallSessionWidget> {
  RtcEngine? _engine;
  bool _isJoined = false;
  bool _isMuted = false;
  bool _isVideoOn = true;
  bool _isSpeakerPhone = true;
  int? _remoteUid;
  
  DateTime? _startedAt;
  int _durationSeconds = 0;

  @override
  void initState() {
    super.initState();
    _isVideoOn = widget.isVideoCall;
    _initAgora();
  }

  /// Initialize Agora SDK engine and request permissions
  Future<void> _initAgora() async {
    // 1. Create engine
    _engine = createAgoraRtcEngine();
    await _engine!.initialize(const RtcEngineContext(
      appId: "YOUR_AGORA_APP_ID_HERE",
      channelProfile: ChannelProfileType.channelProfileCommunication,
    ));

    // 2. Set up event handlers
    _engine!.registerEventHandler(RtcEngineEventHandler(
      onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
        setState(() {
          _isJoined = true;
          _startedAt = DateTime.now();
        });
        _startCallTimer();
      },
      onUserJoined: (RtcConnection connection, int remoteUid, int elapsed) {
        setState(() {
          _remoteUid = remoteUid;
        });
      },
      onUserOffline: (RtcConnection connection, int remoteUid, UserOfflineReasonType reason) {
        setState(() {
          _remoteUid = null;
        });
        _endCall(status: 'completed');
      },
    ));

    // 3. Configure audio/video tracks
    if (widget.isVideoCall) {
      await _engine!.enableVideo();
      await _engine!.startPreview(); // Display pre-call local preview!
    } else {
      await _engine!.enableAudio();
    }

    // 4. Join Agora Channel
    await _engine!.joinChannel(
      token: "YOUR_DYNAMIC_TOKEN_HERE",
      channelId: widget.callId,
      uid: 0,
      options: const ChannelMediaOptions(
        clientRoleType: ClientRoleType.clientRoleBroadcaster,
      ),
    );
  }

  /// Track active duration
  void _startCallTimer() {
    Future.delayed(const Duration(seconds: 1), () {
      if (!mounted || !_isJoined) return;
      setState(() {
        _durationSeconds++;
      });
      _startCallTimer();
    });
  }

  /// Flip front and rear camera facing mode
  Future<void> _switchCamera() async {
    if (_engine != null && _isVideoOn) {
      await _engine!.switchCamera();
    }
  }

  /// Toggle microphone track state
  Future<void> _toggleMute() async {
    if (_engine != null) {
      setState(() {
        _isMuted = !_isMuted;
      });
      await _engine!.muteLocalAudioStream(_isMuted);
    }
  }

  /// Toggle camera transmission track state
  Future<void> _toggleCamera() async {
    if (_engine != null && widget.isVideoCall) {
      setState(() {
        _isVideoOn = !_isVideoOn;
      });
      await _engine!.muteLocalVideoStream(!_isVideoOn);
    }
  }

  /// Toggle speaker audio output destination
  Future<void> _toggleSpeaker() async {
    if (_engine != null) {
      setState(() {
        _isSpeakerPhone = !_isSpeakerPhone;
      });
      await _engine!.setEnableSpeakerphone(_isSpeakerPhone);
    }
  }

  /// End Call Session, stop tracking, release resources, log to Firestore
  Future<void> _endCall({required String status}) async {
    // 1. Log Call History to Firestore as requested
    final endTime = DateTime.now();
    final startTime = _startedAt ?? endTime;
    final coinsCharged = (_durationSeconds / 60).ceil() * widget.coinRatePerMinute;

    try {
      await FirebaseFirestore.instance.collection('call_history').doc(widget.callId).set({
        'callId': widget.callId,
        'callerId': widget.callerId,
        'receiverId': widget.receiverId,
        'callType': widget.isVideoCall ? 'video' : 'voice',
        'startedAt': startTime.toIso8601String(),
        'endedAt': endTime.toIso8601String(),
        'duration': _durationSeconds,
        'coinsCharged': coinsCharged,
        'status': status,
      });
      print('[Firestore] Logged call history successfully');
    } catch (e) {
      print('[Firestore] Failed to log call history: $e');
    }

    // 2. Clear engine tracks cleanly (IMPORTANT)
    if (_engine != null) {
      await _engine!.leaveChannel();
      await _engine!.release();
      _engine = null;
    }

    if (mounted) {
      Navigator.of(context).pop();
    }
  }

  @override
  void dispose() {
    // Release tracks if call is closed abruptly
    if (_engine != null) {
      _engine!.leaveChannel();
      _engine!.release();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // 1. Remote Camera Stream or Avatar Background
          _remoteUid != null && widget.isVideoCall
              ? AgoraVideoView(
                  controller: VideoViewController.remote(
                    rtcEngine: _engine!,
                    canvas: VideoCanvas(uid: _remoteUid),
                    connection: RtcConnection(channelId: widget.callId),
                  ),
                )
              : Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const CircleAvatar(
                        radius: 50,
                        backgroundImage: NetworkImage('https://via.placeholder.com/150'),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        widget.receiverName,
                        style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _isJoined ? 'Connected' : 'Connecting HD link...',
                        style: const TextStyle(color: Colors.grey),
                      ),
                    ],
                  ),
                ),

          // 2. Floating Local Camera Preview (Top Right corner)
          if (widget.isVideoCall && _engine != null && _isVideoOn)
            Positioned(
              right: 20,
              top: 50,
              width: 100,
              height: 150,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: AgoraVideoView(
                  controller: VideoViewController(
                    rtcEngine: _engine!,
                    canvas: const VideoCanvas(uid: 0),
                  ),
                ),
              ),
            ),

          // 3. Status Headers (Coins & Active Timer)
          Positioned(
            left: 20,
            top: 50,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(20)),
                  child: Text(
                    'Duration: ${_durationSeconds ~/ 60}:${(_durationSeconds % 60).toString().padLeft(2, '0')}',
                    style: const TextStyle(color: Colors.white, fontFamily: 'monospace'),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: Colors.pink.withOpacity(0.2), borderRadius: BorderRadius.circular(20)),
                  child: Text(
                    '${widget.coinRatePerMinute} Coins/Min',
                    style: const TextStyle(color: Colors.pinkAccent),
                  ),
                ),
              ],
            ),
          ),

          // 4. In-Call Interactive Control Buttons (Bottom Controls)
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                // Toggle Mic Mute
                IconButton(
                  icon: Icon(_isMuted ? Icons.mic_off : Icons.mic, color: Colors.white),
                  onPressed: _toggleMute,
                ),
                
                // Toggle Speaker Phone
                IconButton(
                  icon: Icon(_isSpeakerPhone ? Icons.volume_up : Icons.volume_off, color: Colors.white),
                  onPressed: _toggleSpeaker,
                ),
                
                if (widget.isVideoCall) ...[
                  // Toggle Video On/Off
                  IconButton(
                    icon: Icon(_isVideoOn ? Icons.videocam : Icons.videocam_off, color: Colors.white),
                    onPressed: _toggleCamera,
                  ),
                  
                  // Switch Facing Mode (Front/Rear Camera)
                  IconButton(
                    icon: const Icon(Icons.flip_camera_ios, color: Colors.white),
                    onPressed: _switchCamera,
                  ),
                ],

                // End Session button
                FloatingActionButton(
                  backgroundColor: Colors.red,
                  onPressed: () => _endCall(status: 'completed'),
                  child: const Icon(Icons.call_end, color: Colors.white),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
```
