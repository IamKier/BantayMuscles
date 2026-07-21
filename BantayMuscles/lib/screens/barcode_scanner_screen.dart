import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../models/nutrition.dart';
import '../online_search.dart';
import '../theme.dart';

/// Scans a product barcode and resolves it to a food via Open Food Facts.
/// Pushed as a full-screen route; pops with the resolved [Food] on success.
class BarcodeScannerScreen extends StatefulWidget {
  const BarcodeScannerScreen({super.key});

  @override
  State<BarcodeScannerScreen> createState() => _BarcodeScannerScreenState();
}

enum _Status { scanning, looking, error }

class _BarcodeScannerScreenState extends State<BarcodeScannerScreen> {
  final _controller = MobileScannerController(
    formats: const [
      BarcodeFormat.ean13,
      BarcodeFormat.ean8,
      BarcodeFormat.upcA,
      BarcodeFormat.upcE,
    ],
  );

  _Status _status = _Status.scanning;
  String? _message;
  // Guards against the camera firing the same barcode dozens of times a second.
  bool _handled = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_handled) return;
    final code = capture.barcodes.isEmpty ? null : capture.barcodes.first.rawValue;
    if (code == null || code.isEmpty) return;

    _handled = true;
    setState(() {
      _status = _Status.looking;
      _message = null;
    });

    final result = await lookupBarcode(code);
    if (!mounted) return;
    if (result.ok) {
      Navigator.of(context).pop(result.food);
      return;
    }
    setState(() {
      _status = _Status.error;
      _message = result.error;
    });
  }

  void _scanAgain() {
    setState(() {
      _handled = false;
      _status = _Status.scanning;
      _message = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Scaffold(
      backgroundColor: colors.background,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Scan barcode',
                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: Icon(Icons.close, color: colors.text),
                  ),
                ],
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      MobileScanner(
                        controller: _controller,
                        onDetect: _onDetect,
                        errorBuilder: (context, error, _) => _CameraError(error: error),
                      ),
                      // Aiming reticle.
                      IgnorePointer(
                        child: Center(
                          child: FractionallySizedBox(
                            widthFactor: 0.78,
                            heightFactor: 0.38,
                            child: Container(
                              decoration: BoxDecoration(
                                border: Border.all(color: colors.accent, width: 3),
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                          ),
                        ),
                      ),
                      if (_status != _Status.scanning)
                        Positioned(
                          left: 0,
                          right: 0,
                          bottom: 0,
                          child: Container(
                            color: const Color(0xB0000000),
                            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                if (_status == _Status.looking) ...[
                                  const SizedBox(
                                      width: 16,
                                      height: 16,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)),
                                  const SizedBox(width: 12),
                                  const Flexible(
                                    child: Text('Looking it up…',
                                        style: TextStyle(color: Colors.white)),
                                  ),
                                ] else ...[
                                  Flexible(
                                    child: Text(_message ?? 'Not found',
                                        style: const TextStyle(color: Colors.white)),
                                  ),
                                  const SizedBox(width: 12),
                                  TextButton(
                                    onPressed: _scanAgain,
                                    child: Text('Scan again',
                                        style: TextStyle(color: colors.accent, fontWeight: FontWeight.w700)),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'Point the camera at a product barcode. Packaged groceries only — '
                'values come per 100 g from Open Food Facts.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: colors.textSecondary),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CameraError extends StatelessWidget {
  final MobileScannerException error;
  const _CameraError({required this.error});

  @override
  Widget build(BuildContext context) {
    final denied = error.errorCode == MobileScannerErrorCode.permissionDenied;
    return ColoredBox(
      color: Colors.black,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.camera_alt_outlined, size: 40, color: Colors.white70),
              const SizedBox(height: 12),
              Text(
                denied
                    ? 'Camera access is needed to scan barcodes. Enable it in Settings.'
                    : 'Camera unavailable. Try Quick add instead.',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white70),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
