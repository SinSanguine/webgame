import map_object from './map_object.mjs';
const vertex_num_components = 2;
/**
 * @template {import('../config/object_config.mjs').object_config} T
 * @param {WebGLRenderingContext} gl
 * @param {WebGLProgram} shader_program
 * @param {T} object_config
 */
export default (gl, object_config, shader_program) => {

    const vertex_buffer = gl.createBuffer();
    let current_index= 0;
    /** @type {{[key in keyof T]: {vertex_index:number,vertex_count: number,mode:number}}} */
    const enhanced_object_config = {};
    const buffer_array = new Float32Array(Object.values(object_config).map(({ vertex_array,mode }) => vertex_array.length).reduce((acc, val) => acc + val, 0));

    Object.entries(object_config).forEach(([key, { vertex_array,mode }])=>{
        buffer_array.set(vertex_array,current_index);
        enhanced_object_config[key] = {
            mode,
            vertex_index: current_index / vertex_num_components, 
            vertex_count: vertex_array.length / vertex_num_components,
        };
        current_index+= vertex_array.length;
    });

    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, buffer_array, gl.STATIC_DRAW);
    const aVertexPosition = gl.getAttribLocation(shader_program, "aVertexPosition");
    gl.enableVertexAttribArray(aVertexPosition);
    gl.vertexAttribPointer(
        aVertexPosition,
        vertex_num_components,
        gl.FLOAT,
        false,
        0,
        0,
    );

    const objects = map_object(enhanced_object_config, ({vertex_index,vertex_count,mode}) => {
        return {
            draw: () => {
                gl.drawArrays(mode, vertex_index, vertex_count);
            }
        };
    });
    return objects;
}
