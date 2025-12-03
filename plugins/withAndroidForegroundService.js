const { withAndroidManifest } = require('@expo/config-plugins');

const withAndroidForegroundService = (config) => {
    return withAndroidManifest(config, (config) => {
        const androidManifest = config.modResults;
        const mainApplication = androidManifest.manifest.application[0];

        // Find or create the service entry for RNBackgroundActionsTask
        let service = mainApplication.service?.find(
            (s) => s.$['android:name'] === 'com.asterinet.react.bgactions.RNBackgroundActionsTask'
        );

        if (!service) {
            service = {
                $: {
                    'android:name': 'com.asterinet.react.bgactions.RNBackgroundActionsTask',
                },
            };
            if (!mainApplication.service) {
                mainApplication.service = [];
            }
            mainApplication.service.push(service);
        }

        // Add the foregroundServiceType
        // using 'location|connectedDevice' for Bluetooth/Location tracking
        service.$['android:foregroundServiceType'] = 'location|connectedDevice';

        return config;
    });
};

module.exports = withAndroidForegroundService;
