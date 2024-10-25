/**
 * @param {WebGLRenderingContext} gl
 * @param {WebGLShader} shader
 */
export default (gl, shader) => {
    if (!gl.getShaderParameter(shader, WebGL2RenderingContext.COMPILE_STATUS)) {
        console.log(`Error compiling shader:`);
        console.log(gl.getShaderInfoLog(shader));
    }
}
