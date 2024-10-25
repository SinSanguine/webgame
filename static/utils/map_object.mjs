
/**
 * @template {object} T
 * @template U
 * @param {T} obj
 * @param {(arg:ValueOf<T>,key: key_of_union<T>)=>U} mappingFn
 * @returns {undefined extends U ?Partial<MapTo<T,Exclude<U,undefined>>> : MapTo<T, U>}
 */
function map_object(obj, mappingFn) {

    /** @type {MapTo<T, U>} */
    // @ts-ignore-error
    const newObj = {};
    for (const i in obj) {

        if (obj.hasOwnProperty(i)) {

            const oldValue = obj[i];
            const newValue = mappingFn(oldValue, i);
            if (newValue !== undefined)
                newObj[i] = newValue;

        }

    }
    return newObj;

};
export default map_object;
/**
 * @template T
 * @typedef  {T extends T ? keyof T: never} key_of_union
 */
/**
 * @template T
 * @template U
 * @typedef { {[P in keyof T]: U}} MapTo
 */
/**
 * @template T
 * @typedef {T[keyof T]} ValueOf
 */