
import check_shader_for_error from './check_shader_for_error.mjs';
import map_object from './map_object.mjs';
/**
 * @param {WebGLRenderingContext} gl
 * @param {import('../config/shader_config.mjs').shader_config} shader_config
 */
export default (gl, shader_config) => {

    const shaders = map_object(shader_config, ({ code, type, variables, prefix = '' }) => {

        const shader = gl.createShader(type);
        if (!shader)
            throw Error('Error creating Shader')
        gl.shaderSource(shader, `
${prefix}

${Object.entries(variables).map(([variable_name, { type, scope }]) => `${scope} ${type} ${variable_name};`).join('\n')}

${code}
`);
        gl.compileShader(shader);
        check_shader_for_error(gl, shader);
        return shader;
    });


    const shaderProgram = gl.createProgram();
    if (!shaderProgram)
        throw Error('error creating shader program');
    Object.values(shaders).forEach((shader) => {
        gl.attachShader(shaderProgram, shader);
    });
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.log("Error linking shader program:");
        console.log(gl.getProgramInfoLog(shaderProgram));
    }
    gl.useProgram(shaderProgram);
    return shaderProgram;
}
