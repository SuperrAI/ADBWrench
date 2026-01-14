/**
 * Device Info Service
 *
 * Fetches comprehensive device information via ADB shell commands.
 */

import { shell } from './adb';

export interface DeviceIdentity {
  model: string;
  manufacturer: string;
  device: string;
  serial: string;
}

export interface BuildInfo {
  androidVersion: string;
  sdkLevel: string;
  buildFingerprint: string;
  buildDate: string;
  securityPatch: string;
}

export interface HardwareInfo {
  cpuArchitecture: string;
  hardwarePlatform: string;
  totalRam: string;
  displayResolution: string;
  displayDensity: string;
}

export interface StorageInfo {
  totalStorage: string;
  usedStorage: string;
  availableStorage: string;
  usagePercent: number;
}

export interface BatteryInfo {
  level: number;
  status: string;
  health: string;
  temperature: string;
  voltage: string;
  technology: string;
}

export interface FullDeviceInfo {
  identity: DeviceIdentity;
  build: BuildInfo;
  hardware: HardwareInfo;
  storage: StorageInfo;
  battery: BatteryInfo;
}

/**
 * Get a system property value
 */
async function getProp(prop: string): Promise<string> {
  try {
    const result = await shell(`getprop ${prop}`);
    return result.trim();
  } catch {
    return '';
  }
}

/**
 * Fetch device identity information
 */
export async function fetchDeviceIdentity(serial: string): Promise<DeviceIdentity> {
  const [model, manufacturer, device] = await Promise.all([
    getProp('ro.product.model'),
    getProp('ro.product.manufacturer'),
    getProp('ro.product.device'),
  ]);

  return {
    model: model || 'Unknown Model',
    manufacturer: manufacturer || 'Unknown',
    device: device || 'unknown',
    serial,
  };
}

/**
 * Fetch build information
 */
export async function fetchBuildInfo(): Promise<BuildInfo> {
  const [androidVersion, sdkLevel, buildFingerprint, buildDate, securityPatch] = await Promise.all([
    getProp('ro.build.version.release'),
    getProp('ro.build.version.sdk'),
    getProp('ro.build.fingerprint'),
    getProp('ro.build.date'),
    getProp('ro.build.version.security_patch'),
  ]);

  return {
    androidVersion: androidVersion || 'Unknown',
    sdkLevel: sdkLevel || 'Unknown',
    buildFingerprint: buildFingerprint || 'Unknown',
    buildDate: buildDate || 'Unknown',
    securityPatch: securityPatch || 'Unknown',
  };
}

/**
 * Parse memory info from /proc/meminfo
 */
function parseMemInfo(meminfo: string): string {
  const match = meminfo.match(/MemTotal:\s+(\d+)\s+kB/);
  if (match) {
    const kb = parseInt(match[1], 10);
    const gb = (kb / 1024 / 1024).toFixed(1);
    return `${gb} GB`;
  }
  return 'Unknown';
}

/**
 * Parse display size from wm size output
 */
function parseDisplaySize(wmSize: string): string {
  const match = wmSize.match(/Physical size:\s*(\d+x\d+)/);
  if (match) {
    return match[1];
  }
  // Try override size if physical not found
  const overrideMatch = wmSize.match(/Override size:\s*(\d+x\d+)/);
  if (overrideMatch) {
    return overrideMatch[1];
  }
  return wmSize.trim() || 'Unknown';
}

/**
 * Parse display density from wm density output
 */
function parseDisplayDensity(wmDensity: string): string {
  const match = wmDensity.match(/Physical density:\s*(\d+)/);
  if (match) {
    return `${match[1]} dpi`;
  }
  // Try override density if physical not found
  const overrideMatch = wmDensity.match(/Override density:\s*(\d+)/);
  if (overrideMatch) {
    return `${overrideMatch[1]} dpi`;
  }
  return wmDensity.trim() || 'Unknown';
}

/**
 * Fetch hardware information
 */
export async function fetchHardwareInfo(): Promise<HardwareInfo> {
  const [cpuArchitecture, hardwarePlatform, meminfo, wmSize, wmDensity] = await Promise.all([
    getProp('ro.product.cpu.abi'),
    getProp('ro.hardware'),
    shell('cat /proc/meminfo').catch(() => ''),
    shell('wm size').catch(() => ''),
    shell('wm density').catch(() => ''),
  ]);

  return {
    cpuArchitecture: cpuArchitecture || 'Unknown',
    hardwarePlatform: hardwarePlatform || 'Unknown',
    totalRam: parseMemInfo(meminfo),
    displayResolution: parseDisplaySize(wmSize),
    displayDensity: parseDisplayDensity(wmDensity),
  };
}

/**
 * Parse storage info from df output
 */
function parseStorageInfo(dfOutput: string): StorageInfo {
  // df output format: Filesystem Size Used Avail Use% Mounted on
  const lines = dfOutput.trim().split('\n');

  for (const line of lines) {
    if (line.includes('/data')) {
      const parts = line.split(/\s+/);
      if (parts.length >= 5) {
        const total = parts[1];
        const used = parts[2];
        const available = parts[3];
        const usePercent = parseInt(parts[4], 10) || 0;

        return {
          totalStorage: formatStorageSize(total),
          usedStorage: formatStorageSize(used),
          availableStorage: formatStorageSize(available),
          usagePercent: usePercent,
        };
      }
    }
  }

  return {
    totalStorage: 'Unknown',
    usedStorage: 'Unknown',
    availableStorage: 'Unknown',
    usagePercent: 0,
  };
}

/**
 * Format storage size to GB with one decimal place
 */
function formatStorageSize(size: string): string {
  const match = size.match(/^(\d+(?:\.\d+)?)([GMKT])?$/i);
  if (!match) return size;

  const value = parseFloat(match[1]);
  const unit = (match[2] || 'K').toUpperCase(); // df usually returns in 1K blocks

  // Convert to GB
  let gbValue: number;
  switch (unit) {
    case 'G':
      gbValue = value;
      break;
    case 'M':
      gbValue = value / 1024;
      break;
    case 'K':
      gbValue = value / (1024 * 1024);
      break;
    case 'T':
      gbValue = value * 1024;
      break;
    default:
      // Assume KB if no unit
      gbValue = value / (1024 * 1024);
  }

  return `${gbValue.toFixed(1)} GB`;
}

/**
 * Fetch storage information
 */
export async function fetchStorageInfo(): Promise<StorageInfo> {
  try {
    const dfOutput = await shell('df /data');
    return parseStorageInfo(dfOutput);
  } catch {
    return {
      totalStorage: 'Unknown',
      usedStorage: 'Unknown',
      availableStorage: 'Unknown',
      usagePercent: 0,
    };
  }
}

/**
 * Parse battery info from dumpsys battery
 */
function parseBatteryInfo(dumpsys: string): BatteryInfo {
  const getValue = (key: string): string => {
    const match = dumpsys.match(new RegExp(`${key}:\\s*(.+)`, 'i'));
    return match ? match[1].trim() : '';
  };

  const level = parseInt(getValue('level'), 10) || 0;
  const statusCode = parseInt(getValue('status'), 10);
  const healthCode = parseInt(getValue('health'), 10);
  const temp = parseInt(getValue('temperature'), 10);
  const voltage = parseInt(getValue('voltage'), 10);
  const technology = getValue('technology');

  // Status codes: 1=Unknown, 2=Charging, 3=Discharging, 4=Not charging, 5=Full
  const statusMap: Record<number, string> = {
    1: 'Unknown',
    2: 'Charging',
    3: 'Discharging',
    4: 'Not Charging',
    5: 'Full',
  };

  // Health codes: 1=Unknown, 2=Good, 3=Overheat, 4=Dead, 5=Over voltage, 6=Unspecified failure, 7=Cold
  const healthMap: Record<number, string> = {
    1: 'Unknown',
    2: 'Good',
    3: 'Overheat',
    4: 'Dead',
    5: 'Over Voltage',
    6: 'Failure',
    7: 'Cold',
  };

  return {
    level,
    status: statusMap[statusCode] || 'Unknown',
    health: healthMap[healthCode] || 'Unknown',
    temperature: temp ? `${(temp / 10).toFixed(1)}°C` : 'Unknown',
    voltage: voltage ? `${(voltage / 1000).toFixed(2)} V` : 'Unknown',
    technology: technology || 'Unknown',
  };
}

/**
 * Fetch battery information
 */
export async function fetchBatteryInfo(): Promise<BatteryInfo> {
  try {
    const dumpsys = await shell('dumpsys battery');
    return parseBatteryInfo(dumpsys);
  } catch {
    return {
      level: 0,
      status: 'Unknown',
      health: 'Unknown',
      temperature: 'Unknown',
      voltage: 'Unknown',
      technology: 'Unknown',
    };
  }
}

/**
 * Fetch all device information
 */
export async function fetchAllDeviceInfo(serial: string): Promise<FullDeviceInfo> {
  const [identity, build, hardware, storage, battery] = await Promise.all([
    fetchDeviceIdentity(serial),
    fetchBuildInfo(),
    fetchHardwareInfo(),
    fetchStorageInfo(),
    fetchBatteryInfo(),
  ]);

  return { identity, build, hardware, storage, battery };
}

/**
 * Format device info as copyable text
 */
export function formatDeviceInfoText(info: FullDeviceInfo): string {
  const lines: string[] = [
    '=== Device Information ===',
    '',
    '-- Device Identity --',
    `Model: ${info.identity.model}`,
    `Manufacturer: ${info.identity.manufacturer}`,
    `Device: ${info.identity.device}`,
    `Serial: ${info.identity.serial}`,
    '',
    '-- Build Information --',
    `Android Version: ${info.build.androidVersion}`,
    `SDK Level: ${info.build.sdkLevel}`,
    `Build Fingerprint: ${info.build.buildFingerprint}`,
    `Build Date: ${info.build.buildDate}`,
    `Security Patch: ${info.build.securityPatch}`,
    '',
    '-- Hardware Information --',
    `CPU Architecture: ${info.hardware.cpuArchitecture}`,
    `Hardware Platform: ${info.hardware.hardwarePlatform}`,
    `Total RAM: ${info.hardware.totalRam}`,
    `Display Resolution: ${info.hardware.displayResolution}`,
    `Display Density: ${info.hardware.displayDensity}`,
    '',
    '-- Storage Information --',
    `Total Storage: ${info.storage.totalStorage}`,
    `Used Storage: ${info.storage.usedStorage}`,
    `Available Storage: ${info.storage.availableStorage}`,
    `Usage: ${info.storage.usagePercent}%`,
    '',
    '-- Battery Information --',
    `Level: ${info.battery.level}%`,
    `Status: ${info.battery.status}`,
    `Health: ${info.battery.health}`,
    `Temperature: ${info.battery.temperature}`,
    `Voltage: ${info.battery.voltage}`,
    `Technology: ${info.battery.technology}`,
  ];

  return lines.join('\n');
}
