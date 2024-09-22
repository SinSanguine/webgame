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


// Vertex information

let vertexArray;
let vertexBuffer;
let vertexNumComponents;
let vertexCount;

// Rendering data shared with the
// scalers.
let aVertexPosition;

// Animation timing

const size = 0.1;
const degreesPerSecond = 180.0;
const client_id = (Math.random() + 1).toString(36).substring(7);
const topic = `players/${client_id}`;
const sync_time = 5;
let previousTime = 0.0;
/**@type {{[client_id:string]: [number,number]}} */
let players = {

};
window.addEventListener("load", startup, false);

async function startup() {
    try {
        /** @type {{default: import('mqtt')}} */
        const { default: mqtt } = await import('/mqtt/dist/mqtt.esm.js');
        const mqtt_client = await mqtt.connectAsync('ws://localhost:8333/');
        mqtt_client.subscribe('players/+', err => {

            if (err)
                console.log(err);

        });
        mqtt_client.on('message', (incoming_topic, message_buffer) => {

            const message = message_buffer.toString('utf8');
            console.log('message', incoming_topic, message);
            if (incoming_topic !== topic)
                players[topic] = JSON.parse(message);


        });
        const glCanvas = document.getElementById("glcanvas");
        if (!glCanvas || !(glCanvas instanceof HTMLCanvasElement))
            throw Error('canvas wrong')
        const gl = glCanvas.getContext("webgl");
        if (!gl)
            throw Error('no webgl context');

        const shader_config =
/** 
  * @satisfies {{[shader_name:string]: {
  * type: typeof gl.VERTEX_SHADER | typeof gl.FRAGMENT_SHADER;
  * variables: {[variable_name:string]: {scope:'attribute' | 'uniform' | 'varying'} & ({type: 'vec2',default_value?: variable_type_to_type['vec2']} | {type: 'vec4',default_value?: variable_type_to_type['vec4']})};
  * prefix?:string;
  * code: string;
  * }}} 
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
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.log(
                    `Error compiling ${type === gl.VERTEX_SHADER ? "vertex" : "fragment"
                    } shader:`,
                );
                console.log(gl.getShaderInfoLog(shader));
            }
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

        /**@type {[number,number]} */
        let currentRotation = [0, 1];

        vertexArray = new Float32Array([
            -size, size, size, size, size, -size, -size, size, size, -size, -size, -size,
        ]);

        vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);

        vertexNumComponents = 2;
        vertexCount = vertexArray.length / vertexNumComponents;

        let currentAngle = 0.0;


        let last_time = Date.now();

        glCanvas.addEventListener('mousemove', (event) => {
            const { width: css_width, height: css_height } = getComputedStyle(glCanvas);
            const { width, height } = { width: Number.parseInt(css_width.slice(0, -1 * 'px'.length)), height: Number.parseInt(css_height.slice(0, -1 * 'px'.length)) };
            players[client_id] = [
                (event.clientX / width * 2 - 1),
                (-event.clientY / height * 2 + 1)
            ];
            if ((last_time + sync_time) < Date.now()) {
                last_time = Date.now();
                mqtt_client.publishAsync(topic, JSON.stringify(players[client_id]), { qos: 1, retain: true })
                    .then(() => console.log(topic))
                    .catch(console.log);
            }
            // console.log(event.clientX, width, x);
            // console.log(event.clientY, height, y);
        })

        const animateScene = () => {
            resizeCanvasToDisplaySize(glCanvas);
            const { width: css_width, height: css_height } = getComputedStyle(glCanvas);
            const { width, height } = { width: Number.parseInt(css_width.slice(0, -1 * 'px'.length)), height: Number.parseInt(css_height.slice(0, -1 * 'px'.length)) }
            gl.viewport(0, 0, width, height);
            gl.clearColor(0, 0, 0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            const radians = (currentAngle * Math.PI) / 180.0;
            currentRotation[0] = Math.sin(radians);
            currentRotation[1] = Math.cos(radians);


            variables.vertex_shader.uScalingFactor = [height > width ? 1.0 : height / width, width > height ? 1.0 : width / height];
            variables.vertex_shader.uRotationVector = currentRotation;

            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

            aVertexPosition = gl.getAttribLocation(shaderProgram, "aVertexPosition");

            gl.enableVertexAttribArray(aVertexPosition);
            gl.vertexAttribPointer(
                aVertexPosition,
                vertexNumComponents,
                gl.FLOAT,
                false,
                0,
                0,
            );

            Object.values(players).forEach(position => {
                variables.vertex_shader.u_position_adjust = position;
                gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
            });

            requestAnimationFrame((currentTime) => {
                const deltaAngle =
                    ((currentTime - previousTime) / 1000.0) * degreesPerSecond;

                currentAngle = (currentAngle + deltaAngle) % 360;

                previousTime = currentTime;
                animateScene();
            });
        };
        animateScene();

    } catch (err) {
        console.log(err);
    }
}



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
function resizeCanvasToDisplaySize(canvas) {
    // Lookup the size the browser is displaying the canvas in CSS pixels.
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    // Check if the canvas is not the same size.
    const needResize = canvas.width !== displayWidth ||
        canvas.height !== displayHeight;

    if (needResize) {
        // Make the canvas the same size
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }

    return needResize;
}