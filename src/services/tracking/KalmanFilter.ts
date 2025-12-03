import KalmanFilter from 'kalmanjs';

export class RssiSmoother {
    kf: KalmanFilter;

    constructor(processNoise = 0.001, measurementNoise = 50) {
        this.kf = new KalmanFilter({ R: processNoise, Q: measurementNoise });
    }

    filter(rssi: number): number {
        return this.kf.filter(rssi);
    }
}
