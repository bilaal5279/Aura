// Common OUI (Organizationally Unique Identifier) Mappings
// Format: "XX:XX:XX" -> "Manufacturer"

const OUI_MAP: Record<string, string> = {
    // Samsung
    '00:12:47': 'Samsung', '00:15:99': 'Samsung', '00:1E:E5': 'Samsung', '00:21:19': 'Samsung',
    '00:23:D7': 'Samsung', '00:24:54': 'Samsung', '00:26:37': 'Samsung', '08:08:C2': 'Samsung',
    '08:37:3D': 'Samsung', '08:FC:88': 'Samsung', '0C:14:20': 'Samsung', '0C:71:5D': 'Samsung',
    '10:1D:C0': 'Samsung', '10:77:17': 'Samsung', '14:32:D1': 'Samsung', '18:1E:B0': 'Samsung',
    '18:67:B0': 'Samsung', '1C:5A:3E': 'Samsung', '20:13:E0': 'Samsung', '24:00:BA': 'Samsung',
    '24:4B:03': 'Samsung', '28:98:7B': 'Samsung', '2C:0E:3D': 'Samsung', '30:CD:A7': 'Samsung',
    '34:14:5F': 'Samsung', '34:23:87': 'Samsung', '34:C0:59': 'Samsung', '38:01:95': 'Samsung',
    '38:0A:94': 'Samsung', '38:2D:E8': 'Samsung', '38:94:96': 'Samsung', '3C:62:00': 'Samsung',
    '3C:A6:2F': 'Samsung', '40:0E:85': 'Samsung', '40:B0:FA': 'Samsung', '44:4E:1A': 'Samsung',
    '44:F4:59': 'Samsung', '48:44:F7': 'Samsung', '48:5A:3F': 'Samsung', '4C:BC:A5': 'Samsung',
    '50:01:D9': 'Samsung', '50:32:75': 'Samsung', '50:85:69': 'Samsung', '50:A4:C8': 'Samsung',
    '50:B7:C3': 'Samsung', '50:CC:F8': 'Samsung', '50:F5:20': 'Samsung', '54:40:AD': 'Samsung',
    '54:88:0E': 'Samsung', '54:92:BE': 'Samsung', '58:96:1D': 'Samsung', '58:C5:CB': 'Samsung',
    '5C:0A:5B': 'Samsung', '5C:A3:9D': 'Samsung', '60:03:08': 'Samsung', '60:6B:BD': 'Samsung',
    '60:A1:0A': 'Samsung', '60:AF:6D': 'Samsung', '60:D0:A9': 'Samsung', '64:1C:B0': 'Samsung',
    '64:77:91': 'Samsung', '64:B3:10': 'Samsung', '64:C2:DE': 'Samsung', '68:05:71': 'Samsung',
    '6C:83:36': 'Samsung', '70:2C:1F': 'Samsung', '70:8B:CD': 'Samsung', '70:F9:27': 'Samsung',
    '74:5E:1C': 'Samsung', '78:40:E4': 'Samsung', '78:47:1D': 'Samsung', '78:9E:D0': 'Samsung',
    '78:D6:F0': 'Samsung', '7C:38:66': 'Samsung', '7C:F8:54': 'Samsung', '80:18:A7': 'Samsung',
    '80:57:19': 'Samsung', '80:EA:96': 'Samsung', '84:25:DB': 'Samsung', '84:38:38': 'Samsung',
    '84:55:A5': 'Samsung', '84:7E:40': 'Samsung', '84:C5:A6': 'Samsung', '88:32:9B': 'Samsung',
    '88:9F:FA': 'Samsung', '88:C9:D0': 'Samsung', '8C:71:F8': 'Samsung', '8C:77:12': 'Samsung',
    '90:18:7C': 'Samsung', '94:63:D1': 'Samsung', '94:B1:0A': 'Samsung', '98:1D:FA': 'Samsung',
    '98:52:B1': 'Samsung', '98:83:89': 'Samsung', '9C:02:98': 'Samsung', 'A0:0B:BA': 'Samsung',
    'A0:21:95': 'Samsung', 'A0:82:1F': 'Samsung', 'A4:14:37': 'Samsung', 'A4:EB:D3': 'Samsung',
    'A8:06:00': 'Samsung', 'A8:2B:B9': 'Samsung', 'A8:7C:01': 'Samsung', 'A8:9F:BA': 'Samsung',
    'AC:36:13': 'Samsung', 'AC:5F:3E': 'Samsung', 'B0:C4:E7': 'Samsung', 'B0:EC:93': 'Samsung',
    'B4:07:F9': 'Samsung', 'B4:62:93': 'Samsung', 'B4:79:A7': 'Samsung', 'B8:5A:73': 'Samsung',
    'B8:B4:2E': 'Samsung', 'BC:20:A4': 'Samsung', 'BC:72:B1': 'Samsung', 'BC:85:1F': 'Samsung',
    'BC:8C:CD': 'Samsung', 'BC:98:89': 'Samsung', 'BC:D1:1F': 'Samsung', 'C0:BD:D1': 'Samsung',
    'C4:57:6E': 'Samsung', 'C4:73:1E': 'Samsung', 'C4:88:E5': 'Samsung', 'C8:14:79': 'Samsung',
    'C8:19:F7': 'Samsung', 'CC:07:AB': 'Samsung', 'CC:3A:61': 'Samsung', 'CC:B1:1A': 'Samsung',
    'D0:03:DF': 'Samsung', 'D0:17:C2': 'Samsung', 'D0:C1:B1': 'Samsung', 'D4:87:D8': 'Samsung',
    'D4:E8:B2': 'Samsung', 'D8:31:34': 'Samsung', 'D8:57:EF': 'Samsung', 'D8:90:E8': 'Samsung',
    'DC:71:44': 'Samsung', 'E0:99:71': 'Samsung', 'E4:58:E7': 'Samsung', 'E4:7C:F9': 'Samsung',
    'E4:92:FB': 'Samsung', 'E4:B0:21': 'Samsung', 'E8:03:9A': 'Samsung', 'E8:11:32': 'Samsung',
    'E8:E5:D6': 'Samsung', 'EC:1F:72': 'Samsung', 'EC:E0:9B': 'Samsung', 'F0:25:B7': 'Samsung',
    'F0:6B:CA': 'Samsung', 'F0:E1:D2': 'Samsung', 'F4:09:D8': 'Samsung', 'F4:7B:5E': 'Samsung',
    'F4:9F:54': 'Samsung', 'F4:D9:FB': 'Samsung', 'F8:04:2E': 'Samsung', 'F8:3F:51': 'Samsung',
    'F8:D0:BD': 'Samsung', 'FC:00:12': 'Samsung', 'FC:19:10': 'Samsung', 'FC:A1:3E': 'Samsung',
    'FC:C2:DE': 'Samsung',

    // Apple
    '00:03:93': 'Apple', '00:05:02': 'Apple', '00:0A:27': 'Apple', '00:0A:95': 'Apple',
    '00:0D:93': 'Apple', '00:10:FA': 'Apple', '00:11:24': 'Apple', '00:14:51': 'Apple',
    '00:16:CB': 'Apple', '00:17:F2': 'Apple', '00:19:E3': 'Apple', '00:1B:63': 'Apple',
    '00:1C:B3': 'Apple', '00:1D:4F': 'Apple', '00:1E:52': 'Apple', '00:1E:C2': 'Apple',
    '00:1F:5B': 'Apple', '00:1F:F3': 'Apple', '00:21:E9': 'Apple', '00:22:41': 'Apple',
    '00:23:12': 'Apple', '00:23:32': 'Apple', '00:23:6C': 'Apple', '00:23:DF': 'Apple',
    '00:24:36': 'Apple', '00:25:00': 'Apple', '00:25:4B': 'Apple', '00:25:BC': 'Apple',
    '00:26:08': 'Apple', '00:26:4A': 'Apple', '00:26:B0': 'Apple', '00:26:BB': 'Apple',

    // Sony
    '00:01:4A': 'Sony', '00:0A:D9': 'Sony', '00:13:15': 'Sony', '00:13:A9': 'Sony',
    '00:15:C1': 'Sony', '00:19:C5': 'Sony', '00:1A:80': 'Sony', '00:1D:0D': 'Sony',
    '00:1E:45': 'Sony', '00:1F:A7': 'Sony', '00:24:8D': 'Sony', '00:24:BE': 'Sony',
    '00:25:86': 'Sony', '08:00:46': 'Sony', '28:0D:FC': 'Sony', '2C:26:17': 'Sony',
    '30:39:26': 'Sony', '30:75:12': 'Sony', '30:F9:ED': 'Sony', '34:25:D7': 'Sony',
    '38:2C:4A': 'Sony', '3C:07:71': 'Sony', '40:2B:50': 'Sony', '40:98:AD': 'Sony',
    '44:D8:32': 'Sony', '48:E2:44': 'Sony', '4C:21:D0': 'Sony', '50:2D:1D': 'Sony',
    '54:42:49': 'Sony', '54:53:ED': 'Sony', '58:10:8C': 'Sony', '5C:C5:D4': 'Sony',
    '60:5B:B4': 'Sony', '64:7B:CE': 'Sony', '64:D4:BD': 'Sony', '70:9E:29': 'Sony',
    '78:84:3C': 'Sony', '7C:6D:62': 'Sony', '84:00:D2': 'Sony', '88:87:17': 'Sony',
    '8C:00:6D': 'Sony', '90:84:0D': 'Sony', '94:2C:B3': 'Sony', '94:76:B7': 'Sony',
    '94:DB:C9': 'Sony', '98:3B:16': 'Sony', '9C:2A:70': 'Sony', 'A0:E4:53': 'Sony',
    'A4:0A:B3': 'Sony', 'A8:E3:EE': 'Sony', 'AC:45:00': 'Sony', 'B0:89:00': 'Sony',
    'B4:52:7D': 'Sony', 'B4:52:7E': 'Sony', 'B4:7C:9C': 'Sony', 'B8:A3:86': 'Sony',
    'BC:6E:64': 'Sony', 'C0:38:96': 'Sony', 'C4:3A:BE': 'Sony', 'CC:98:8B': 'Sony',
    'D0:51:62': 'Sony', 'D4:4B:5E': 'Sony', 'D8:D4:3C': 'Sony', 'DC:0C:5C': 'Sony',
    'E0:75:0A': 'Sony', 'E0:8E:1C': 'Sony', 'F0:BF:97': 'Sony', 'F4:64:12': 'Sony',
    'F8:D0:AC': 'Sony', 'FC:0F:E6': 'Sony', 'FC:F1:52': 'Sony',

    // Bose
    '00:0C:8A': 'Bose', '00:11:50': 'Bose', '00:23:05': 'Bose', '04:52:C7': 'Bose',
    '08:DF:1F': 'Bose', '10:4F:A8': 'Bose', '28:11:A5': 'Bose', '2C:41:A1': 'Bose',
    '30:17:C8': 'Bose', '3C:DC:BC': 'Bose', '40:2C:F4': 'Bose', '44:61:32': 'Bose',
    '4C:87:5D': 'Bose', '50:65:83': 'Bose', '5C:17:CF': 'Bose', '60:AB:D4': 'Bose',
    '64:D2:C4': 'Bose', '74:9E:F5': 'Bose', '84:17:15': 'Bose', '9C:64:8B': 'Bose',
    'A0:14:3D': 'Bose', 'A4:38:CC': 'Bose', 'A8:37:03': 'Bose', 'AC:D0:74': 'Bose',
    'B8:6B:23': 'Bose', 'C0:28:8D': 'Bose', 'C8:7B:23': 'Bose', 'D0:E8:4A': 'Bose',
    'D4:9F:54': 'Bose', 'DF:B2:56': 'Bose', 'E0:B9:4D': 'Bose', 'F0:F6:C1': 'Bose',

    // JBL (Harman)
    '00:0A:40': 'JBL', '00:16:94': 'JBL', '00:23:02': 'JBL', '04:F8:C2': 'JBL',
    '18:54:CF': 'JBL', '38:00:25': 'JBL', '44:5E:F3': 'JBL', '48:D0:0C': 'JBL',
    '50:1E:2D': 'JBL', '70:91:8F': 'JBL', '78:44:05': 'JBL', '80:5F:BD': 'JBL',
    '94:A1:A2': 'JBL', 'B4:8B:19': 'JBL', 'B8:69:C2': 'JBL', 'F4:60:E2': 'JBL',
    'F8:4E:73': 'JBL',

    // Google
    '00:1A:11': 'Google', '08:9E:08': 'Google', '10:2F:6B': 'Google', '14:C1:4E': 'Google',
    '20:76:93': 'Google', '24:0D:C2': 'Google', '28:3F:69': 'Google', '2C:33:61': 'Google',
    '30:FD:38': 'Google', '3C:28:6D': 'Google', '3C:5A:B4': 'Google', '40:4E:36': 'Google',
    '44:07:0B': 'Google', '48:D7:05': 'Google', '50:8C:B1': 'Google', '54:60:09': 'Google',
    '58:2F:40': 'Google', '5C:8D:4E': 'Google', '60:45:BD': 'Google', '64:16:66': 'Google',
    '6C:AD:F8': 'Google', '70:3C:69': 'Google', '70:CA:9B': 'Google', '74:12:B3': 'Google',
    '78:4F:43': 'Google', '7C:D9:5C': 'Google', '80:7A:BF': 'Google', '84:11:9E': 'Google',
    '88:3D:24': 'Google', '8C:AF:97': 'Google', '90:2B:34': 'Google', '94:EB:CD': 'Google',
    '98:03:D8': 'Google', '9C:8E:99': 'Google', 'A0:C5:89': 'Google', 'A4:77:33': 'Google',
    'A8:16:D0': 'Google', 'AC:37:43': 'Google', 'B0:C0:90': 'Google', 'B4:F7:A1': 'Google',
    'B8:27:EB': 'Google', 'BC:9F:EF': 'Google', 'C8:85:50': 'Google', 'CC:6E:A4': 'Google',
    'D0:03:4B': 'Google', 'D4:F5:47': 'Google', 'D8:50:E6': 'Google', 'DC:E5:5B': 'Google',
    'E0:D5:5E': 'Google', 'E4:F0:42': 'Google', 'E8:B4:C8': 'Google', 'F0:D2:F1': 'Google',
    'F4:0E:22': 'Google', 'F4:F5:D8': 'Google', 'F8:8F:CA': 'Google', 'FC:A6:67': 'Google',

    // LG
    '00:05:C9': 'LG', '00:10:3F': 'LG', '00:14:80': 'LG', '00:19:A1': 'LG',
    '00:1C:62': 'LG', '00:1E:75': 'LG', '00:1F:6B': 'LG', '00:21:FB': 'LG',
    '00:23:39': 'LG', '00:24:83': 'LG', '00:25:E5': 'LG', '00:26:E2': 'LG',
    '00:34:DA': 'LG', '00:AA:70': 'LG', '00:E0:91': 'LG', '04:18:0F': 'LG',
    '10:68:3F': 'LG', '10:F9:6F': 'LG', '14:89:FD': 'LG', '18:83:BF': 'LG',
    '20:3D:66': 'LG', '28:A1:83': 'LG', '30:B5:C2': 'LG', '34:4D:F7': 'LG',
    '34:FC:EF': 'LG', '3C:BD:D8': 'LG', '48:59:29': 'LG', '4C:66:41': 'LG',
    '50:55:27': 'LG', '58:A2:B5': 'LG', '5C:A8:6A': 'LG', '60:21:C0': 'LG',
    '64:89:9A': 'LG', '6C:2F:2C': 'LG', '70:05:14': 'LG', '78:F8:82': 'LG',
    '7C:1C:4E': 'LG', '80:33:88': 'LG', '84:34:6A': 'LG', '88:36:5F': 'LG',
    '90:9F:33': 'LG', '94:44:44': 'LG', '98:D6:F7': 'LG', '9C:3A:AF': 'LG',
    'A0:91:69': 'LG', 'A4:7E:39': 'LG', 'A8:16:B2': 'LG', 'AC:0D:1B': 'LG',
    'B0:8C:75': 'LG', 'B4:0E:DC': 'LG', 'B8:70:F4': 'LG', 'BC:F5:AC': 'LG',
    'C0:41:F6': 'LG', 'C4:36:6C': 'LG', 'C4:43:8F': 'LG', 'C4:9A:02': 'LG',
    'CC:2D:83': 'LG', 'D0:13:FD': 'LG', 'D4:4F:03': 'LG', 'DC:0B:34': 'LG',
    'E8:5B:5B': 'LG', 'EC:10:7B': 'LG', 'F0:1C:13': 'LG', 'F4:66:12': 'LG',
    'F8:A9:D0': 'LG', 'FC:FC:48': 'LG',

    // Microsoft
    '00:03:FF': 'Microsoft', '00:12:5A': 'Microsoft', '00:17:FA': 'Microsoft', '00:1D:D8': 'Microsoft',
    '00:22:48': 'Microsoft', '00:25:AE': 'Microsoft', '00:50:F2': 'Microsoft', '04:5E:A4': 'Microsoft',
    '10:60:4B': 'Microsoft', '14:58:D0': 'Microsoft', '20:10:7A': 'Microsoft', '24:16:6D': 'Microsoft',
    '28:18:78': 'Microsoft', '2C:56:DC': 'Microsoft', '30:59:B7': 'Microsoft', '34:68:95': 'Microsoft',
    '38:6C:BC': 'Microsoft', '3C:7D:0A': 'Microsoft', '40:99:22': 'Microsoft', '44:8A:5B': 'Microsoft',
    '48:50:73': 'Microsoft', '4C:0B:BE': 'Microsoft', '50:1A:C5': 'Microsoft', '58:82:A8': 'Microsoft',
    '5C:56:ED': 'Microsoft', '64:D4:DA': 'Microsoft', '6C:5D:63': 'Microsoft', '70:BC:10': 'Microsoft',
    '74:E5:43': 'Microsoft', '7C:1E:52': 'Microsoft', '7C:ED:8D': 'Microsoft', '80:2A:A8': 'Microsoft',
    '84:7B:EB': 'Microsoft', '8C:59:C3': 'Microsoft', '94:9A:A9': 'Microsoft', '98:5F:D3': 'Microsoft',
    '9C:6C:15': 'Microsoft', 'A0:D3:C1': 'Microsoft', 'A4:5D:36': 'Microsoft', 'B4:AE:2B': 'Microsoft',
    'BC:83:85': 'Microsoft', 'C0:33:5E': 'Microsoft', 'C4:8E:8F': 'Microsoft', 'CC:B0:DA': 'Microsoft',
    'D0:D2:B0': 'Microsoft', 'D4:6A:6A': 'Microsoft', 'D8:A0:DF': 'Microsoft', 'DC:B5:4F': 'Microsoft',
    'E0:37:BF': 'Microsoft', 'E4:1F:13': 'Microsoft', 'EC:59:E7': 'Microsoft', 'F0:1D:BC': 'Microsoft',
    'F4:30:B9': 'Microsoft', 'F8:63:3F': 'Microsoft', 'FC:F8:AE': 'Microsoft',

    // Xiaomi
    '00:9E:C8': 'Xiaomi', '04:CF:8C': 'Xiaomi', '0C:1D:AF': 'Xiaomi', '10:2A:B3': 'Xiaomi',
    '14:F6:5A': 'Xiaomi', '18:59:36': 'Xiaomi', '1C:91:80': 'Xiaomi', '20:34:FB': 'Xiaomi',
    '24:E2:71': 'Xiaomi', '28:6C:07': 'Xiaomi', '34:80:B3': 'Xiaomi', '38:A4:ED': 'Xiaomi',
    '3C:BD:3E': 'Xiaomi', '40:31:3C': 'Xiaomi', '44:23:7C': 'Xiaomi', '48:3F:E9': 'Xiaomi',
    '4C:49:E3': 'Xiaomi', '50:64:2B': 'Xiaomi', '50:8F:4C': 'Xiaomi', '50:EC:50': 'Xiaomi',
    '54:36:9B': 'Xiaomi', '58:44:98': 'Xiaomi', '60:30:D4': 'Xiaomi', '64:09:80': 'Xiaomi',
    '64:CC:2E': 'Xiaomi', '68:DF:DD': 'Xiaomi', '6C:5A:B5': 'Xiaomi', '70:72:0D': 'Xiaomi',
    '74:23:44': 'Xiaomi', '78:02:F8': 'Xiaomi', '7C:1D:D9': 'Xiaomi', '80:35:C1': 'Xiaomi',
    '84:2A:FD': 'Xiaomi', '88:0F:10': 'Xiaomi', '8C:BE:BE': 'Xiaomi', '90:78:B2': 'Xiaomi',
    '94:87:E0': 'Xiaomi', '98:FA:E3': 'Xiaomi', '9C:2E:A1': 'Xiaomi', 'A0:86:C6': 'Xiaomi',
    'A4:50:46': 'Xiaomi', 'A8:9C:ED': 'Xiaomi', 'AC:C1:EE': 'Xiaomi', 'B0:E2:35': 'Xiaomi',
    'B4:6C:47': 'Xiaomi', 'B8:8D:12': 'Xiaomi', 'BC:3A:EA': 'Xiaomi', 'C0:9F:05': 'Xiaomi',
    'C4:0B:CB': 'Xiaomi', 'C4:6B:B4': 'Xiaomi', 'C8:F2:30': 'Xiaomi', 'CC:08:FB': 'Xiaomi',
    'D0:C5:F3': 'Xiaomi', 'D4:97:0B': 'Xiaomi', 'D8:8F:76': 'Xiaomi', 'DC:2C:26': 'Xiaomi',
    'E0:B9:E5': 'Xiaomi', 'E4:46:DA': 'Xiaomi', 'E8:80:2E': 'Xiaomi', 'EC:D0:9F': 'Xiaomi',
    'F0:18:98': 'Xiaomi', 'F4:8B:32': 'Xiaomi', 'F8:A4:5F': 'Xiaomi', 'FC:64:BA': 'Xiaomi',

    // Fitbit
    '00:24:1C': 'Fitbit', '08:05:81': 'Fitbit', '0C:98:38': 'Fitbit', '10:93:E9': 'Fitbit',
    '14:1F:78': 'Fitbit', '20:02:AF': 'Fitbit',
    // Removed duplicates here

    // Garmin
    '00:05:4F': 'Garmin', '00:11:0E': 'Garmin', '00:1C:D6': 'Garmin', '00:23:75': 'Garmin',
    '10:C6:FC': 'Garmin', '14:13:57': 'Garmin', '14:8F:21': 'Garmin', '20:19:98': 'Garmin',
    // Removed duplicates here

    // Tile
    '50:F5:DA': 'Tile', '88:6B:0F': 'Tile', 'D0:73:D5': 'Tile',
    'E8:06:88': 'Tile', 'F4:0E:11': 'Tile',

    // Chipolo
    'D4:36:39': 'Chipolo',
};

export const getManufacturerFromMac = (mac: string): string | null => {
    if (!mac || mac.length < 8) return null;

    // Normalize MAC to uppercase
    const normalizedMac = mac.toUpperCase();

    // Extract OUI (first 3 bytes: XX:XX:XX)
    const oui = normalizedMac.substring(0, 8);

    return OUI_MAP[oui] || null;
};
