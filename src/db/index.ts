import { appSchema, Database, Model, tableSchema } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { date, field } from '@nozbe/watermelondb/decorators';

// --- Schema ---
export const mySchema = appSchema({
    version: 1,
    tables: [
        tableSchema({
            name: 'location_history',
            columns: [
                { name: 'device_id', type: 'string' },
                { name: 'latitude', type: 'number' },
                { name: 'longitude', type: 'number' },
                { name: 'timestamp', type: 'number' },
            ],
        }),
    ],
});

// --- Models ---
export class LocationHistory extends Model {
    static table = 'location_history';

    @field('device_id') deviceId!: string;
    @field('latitude') latitude!: number;
    @field('longitude') longitude!: number;
    @date('timestamp') timestamp!: Date;
}

// --- Adapter ---
const adapter = new SQLiteAdapter({
    schema: mySchema,
    // (You might want to comment out the following line if you have issues with JSI on Android)
    // jsi: true, 
    onSetUpError: error => {
        console.error('Database failed to load', error);
    },
});

// --- Database ---
export const database = new Database({
    adapter,
    modelClasses: [LocationHistory],
});
