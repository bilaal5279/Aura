export const Purchases = {
    async getCustomerInfo() {
        // Mock response
        return {
            entitlements: {
                active: {
                    // 'pro': { ... } // Uncomment to simulate pro
                },
            },
        };
    },

    async purchasePackage(packageId: string) {
        console.log('Purchasing package:', packageId);
        return {
            customerInfo: {
                entitlements: {
                    active: {
                        'pro': { identifier: 'pro', isActive: true },
                    },
                },
            },
        };
    },
};
