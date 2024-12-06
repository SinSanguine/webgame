
const size = 0.1;
const gl = WebGL2RenderingContext;
/**@param {number} vertex_count */
const calculate_circle_points = (vertex_count)=>{
    const array= [0,0];
    const radius=0.1;

    for (let i = 0; i <= vertex_count; i++) {
        const offset = i * 2 * Math.PI / vertex_count;
        array.push(radius * Math.cos(offset));
        array.push(radius * Math.sin(offset));
    }
    return array;
};
const object_config = 
/** 
  * @satisfies {object_config} 
  */ 
 {
    square:{
        mode: gl.TRIANGLES,
        vertex_array:new Float32Array([
            -size, size, 
            size, size, 
            size, -size, 
            -size, size, 
            size, -size, 
            -size, -size,
        ]),
    },
    triangle: {
        mode: gl.TRIANGLE_FAN,
        vertex_array: new Float32Array(calculate_circle_points(3)),
    },
    circle:{
        mode:gl.TRIANGLE_FAN,
        vertex_array: new Float32Array(calculate_circle_points(16)),
    }
}
/**
 * @typedef {{[object_name:string]: {
  * vertex_array: Float32Array
  * mode: number
  * }}} object_config 
 */
export default object_config;