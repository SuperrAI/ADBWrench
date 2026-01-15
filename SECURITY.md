# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |

## Reporting a Vulnerability

We take the security of ADBWrench seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

1. **Do not** open a public GitHub issue for security vulnerabilities
2. Email your findings to [help@superr.ai](mailto:help@superr.ai)
3. Include as much detail as possible:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment:** We will acknowledge receipt of your report within 48 hours
- **Updates:** We will keep you informed of our progress toward a fix
- **Disclosure:** We will coordinate with you on public disclosure timing

## Security Considerations

### WebUSB & ADB

ADBWrench uses WebUSB to communicate with Android devices via the ADB protocol. Important security notes:

- **User Consent:** WebUSB requires explicit user permission to access devices
- **ADB Authorization:** Devices must have USB debugging enabled and authorize the connection
- **RSA Key Pairs:** ADB authentication uses RSA key pairs stored locally in the browser

### Data Handling

- All device communication happens directly between the browser and the connected device
- No device data is transmitted to external servers
- RSA keys are stored in browser local storage

### Browser Security

- Only Chromium-based browsers (Chrome, Edge) are supported
- Always use the latest browser version to ensure security patches are applied
- The application runs in a sandboxed browser environment

## Best Practices for Users

1. Only connect devices you trust and own
2. Review ADB authorization prompts carefully on your Android device
3. Use ADBWrench on secure, trusted networks
4. Keep your browser updated to the latest version
5. Clear browser data if using shared computers
