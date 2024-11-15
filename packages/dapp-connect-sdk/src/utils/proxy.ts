export const getHandler = () => {
    return {
        get(target: any, prop: any) {
            return Reflect.get(target, prop);
        },
        set(object: any, prop: any, value: any) {
            return Reflect.set(object, prop, value);
        },
        deleteProperty(target: any, prop: any) {
            return Reflect.deleteProperty(target, prop);
        },
    }
};