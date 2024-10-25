const gl=WebGL2RenderingContext;

const shader_config =
/** 
  * @satisfies {shader_config} 
  */ ({
        vertex_shader: {
            type: gl.VERTEX_SHADER,
            variables: {
                aVertexPosition: {
                    type: 'vec2',
                    scope: 'attribute',
                },
                uScalingFactor: {
                    type: 'vec2',
                    scope: 'uniform',
                },
                uRotationVector: {
                    type: 'vec2',
                    scope: 'uniform',
                },
                u_position_adjust: {
                    type: 'vec2',
                    scope: 'uniform',
                }
            },
            code: `
void main() {
  vec2 rotatedPosition = vec2(
    aVertexPosition.x * uRotationVector.y +
          aVertexPosition.y * uRotationVector.x,
    aVertexPosition.y * uRotationVector.y -
          aVertexPosition.x * uRotationVector.x
  );
  gl_Position = vec4(rotatedPosition * uScalingFactor + u_position_adjust, 0.0, 1.0);
}
`
        },
        fragment_shader: {
            type: gl.FRAGMENT_SHADER,
            variables: {
                uGlobalColor: {
                    type: 'vec4',
                    scope: 'uniform',
                    default_value: [0.1, 0.7, 0.2, 1.0],
                }
            },
            prefix: `
precision highp float;
`,
            code: `
void main() {
        gl_FragColor = uGlobalColor;
}
`},
    });

/**
 * @typedef {{[shader_name:string]: {
  * type: typeof gl.VERTEX_SHADER | typeof gl.FRAGMENT_SHADER;
  * variables: {[variable_name:string]: {scope:'attribute' | 'uniform' | 'varying'} & ({type: 'vec2',default_value?: variable_type_to_type['vec2']} | {type: 'vec4',default_value?: variable_type_to_type['vec4']})};
  * prefix?:string;
  * code: string;
  * }}} shader_config 
 */
export default shader_config;