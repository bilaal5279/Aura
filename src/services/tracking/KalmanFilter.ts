import KalmanFilter from 'kalmanjs';

export class RssiSmoother {
    kf: KalmanFilter;

    constructor(processNoise = 0.008, measurementNoise = 4) {
        this.kf = new KalmanFilter({ R: processNoise, Q: measurementNoise });
    }

    filter(rssi: number): number {
        return this.kf.filter(rssi);
    }
}
