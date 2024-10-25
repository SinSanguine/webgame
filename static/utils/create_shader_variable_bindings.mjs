
import map_object from './map_object.mjs';

const scope_to_location_function =/**@type {const}*/ ({
    uniform: 'getUniformLocation',
    attribute: 'getAttribLocation',
});
const scope_to_type_to_set_function =/**@type {const}*/ ({
    uniform: {
        vec2: 'uniform2fv',
        vec4: 'uniform4fv',
    }
});
/**@typedef {{vec2: [number,number],vec4: [number,number,number,number]}} variable_type_to_type */

/**
 * @template {import('../config/shader_config.mjs').shader_config} T
 * @param {WebGLRenderingContext} gl
 * @param {T} shader_config
 * @param {WebGLProgram} shaderProgram
 */
export default (gl, shader_config, shaderProgram) => {
    /**@type {{[shader_name in keyof typeof shader_config]: {[variable in keyof typeof shader_config[shader_name]['variables']]: variable_type_to_type[typeof shader_config[shader_name]['variables'][variable]['type']]}}} */
    //@ts-expect-error
    const variables = map_object(shader_config, ({ variables: vars }) => {

        const result = {};
        Object.defineProperties(result, map_object(vars, /** @return {PropertyDescriptor} */({ type, scope, default_value }, variable_name) => {
            const location = gl[scope_to_location_function[scope]](shaderProgram, variable_name);
            /**@type {unknown} */
            let temp = default_value;
            if (default_value) {
                gl[scope_to_type_to_set_function[scope][type]](location, default_value);
            }
            return ({
                enumerable: true,
                get: () => temp,
                set: (val) => {
                    gl[scope_to_type_to_set_function[scope][type]](location, val);
                    temp = val;
                },
            })
        }))
        return result;
    });
    return variables
}
