/**
 * Package Management Service
 *
 * Handles listing, inspecting, and managing Android packages via ADB.
 */

import { shell, pullFile } from './adb';

export interface PackageInfo {
  packageName: string;
  isSystem: boolean;
  isEnabled: boolean;
  versionName?: string;
  versionCode?: string;
  installedPath?: string;
  firstInstallTime?: string;
  lastUpdateTime?: string;
}

export interface PackageDetails extends PackageInfo {
  permissions: string[];
  activities: string[];
  services: string[];
  receivers: string[];
}

/**
 * List all installed packages
 */
export async function listPackages(includeSystem = true): Promise<PackageInfo[]> {
  const flags = includeSystem ? '-f' : '-f -3'; // -3 for third-party only
  const output = await shell(`pm list packages ${flags}`);

  const packages: PackageInfo[] = [];
  const lines = output.trim().split('\n');

  for (const line of lines) {
    // Format: package:/path/to/app.apk=com.example.app
    const match = line.match(/^package:(.+)=(.+)$/);
    if (match) {
      const path = match[1];
      const packageName = match[2];
      const isSystem = path.startsWith('/system/') || path.startsWith('/product/') || path.startsWith('/vendor/');

      packages.push({
        packageName,
        isSystem,
        isEnabled: true, // Will be updated if needed
        installedPath: path,
      });
    }
  }

  return packages.sort((a, b) => a.packageName.localeCompare(b.packageName));
}

/**
 * Get detailed package information
 */
export async function getPackageDetails(packageName: string): Promise<PackageDetails | null> {
  try {
    const output = await shell(`dumpsys package ${packageName}`);

    const info: PackageDetails = {
      packageName,
      isSystem: false,
      isEnabled: true,
      permissions: [],
      activities: [],
      services: [],
      receivers: [],
    };

    // Parse version info
    const versionNameMatch = output.match(/versionName=([^\s]+)/);
    if (versionNameMatch) info.versionName = versionNameMatch[1];

    const versionCodeMatch = output.match(/versionCode=(\d+)/);
    if (versionCodeMatch) info.versionCode = versionCodeMatch[1];

    // Parse install path
    const codePathMatch = output.match(/codePath=([^\s]+)/);
    if (codePathMatch) {
      info.installedPath = codePathMatch[1];
      info.isSystem = codePathMatch[1].startsWith('/system/') ||
                      codePathMatch[1].startsWith('/product/') ||
                      codePathMatch[1].startsWith('/vendor/');
    }

    // Parse enabled state
    const enabledMatch = output.match(/enabled=(\d+)/);
    if (enabledMatch) info.isEnabled = enabledMatch[1] !== '2' && enabledMatch[1] !== '3';

    // Parse install time
    const firstInstallMatch = output.match(/firstInstallTime=([^\s]+)/);
    if (firstInstallMatch) info.firstInstallTime = firstInstallMatch[1];

    const lastUpdateMatch = output.match(/lastUpdateTime=([^\s]+)/);
    if (lastUpdateMatch) info.lastUpdateTime = lastUpdateMatch[1];

    // Parse requested permissions
    const permSection = output.match(/requested permissions:\s*([\s\S]*?)(?=install permissions:|$)/i);
    if (permSection) {
      const perms = permSection[1].match(/android\.permission\.[A-Z_]+/g);
      if (perms) info.permissions = [...new Set(perms)];
    }

    // Parse activities (simplified)
    const activityMatches = output.matchAll(/Activity.*?([a-zA-Z0-9_.]+\/[a-zA-Z0-9_.]+)/g);
    for (const match of activityMatches) {
      if (!info.activities.includes(match[1])) {
        info.activities.push(match[1]);
      }
    }

    return info;
  } catch {
    return null;
  }
}

/**
 * Get the main activity for a package
 */
export async function getMainActivity(packageName: string): Promise<string | null> {
  try {
    const output = await shell(`cmd package resolve-activity --brief ${packageName}`);
    const match = output.match(/([a-zA-Z0-9_.]+\/[a-zA-Z0-9_.]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Launch an application
 */
export async function launchApp(packageName: string): Promise<void> {
  const activity = await getMainActivity(packageName);
  if (activity) {
    await shell(`am start -n ${activity}`);
  } else {
    // Fallback: try monkey command
    await shell(`monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`);
  }
}

/**
 * Force stop an application
 */
export async function forceStopApp(packageName: string): Promise<void> {
  await shell(`am force-stop ${packageName}`);
}

/**
 * Clear app data
 */
export async function clearAppData(packageName: string): Promise<void> {
  await shell(`pm clear ${packageName}`);
}

/**
 * Uninstall an application
 */
export async function uninstallApp(packageName: string, keepData = false): Promise<string> {
  const flags = keepData ? '-k' : '';
  const output = await shell(`pm uninstall ${flags} ${packageName}`);
  return output.trim();
}

/**
 * Enable a package
 */
export async function enablePackage(packageName: string): Promise<void> {
  await shell(`pm enable ${packageName}`);
}

/**
 * Disable a package
 */
export async function disablePackage(packageName: string): Promise<void> {
  await shell(`pm disable-user --user 0 ${packageName}`);
}

/**
 * Get APK path for a package
 */
export async function getApkPath(packageName: string): Promise<string | null> {
  try {
    const output = await shell(`pm path ${packageName}`);
    const match = output.match(/package:(.+)/);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

/**
 * Extract APK from device
 */
export async function extractApk(packageName: string): Promise<Uint8Array> {
  const apkPath = await getApkPath(packageName);
  if (!apkPath) {
    throw new Error(`Could not find APK path for ${packageName}`);
  }
  return pullFile(apkPath);
}

/**
 * Install APK (requires pushing file first)
 * Note: For web, we'd need to push the file then install
 */
export async function installApk(apkData: Uint8Array, onProgress?: (progress: number) => void): Promise<string> {
  // For simplicity, we'll use pm install with stdin
  // This requires writing the APK to a temp location first
  const tempPath = '/data/local/tmp/install.apk';

  // We need to push the file - this requires the sync protocol
  // For now, throw an error indicating this needs implementation
  throw new Error('APK installation requires file push support - not yet implemented');
}
