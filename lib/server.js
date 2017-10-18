const EventEmitter = require('events');
const { Consumer } = require('raf-tasq');
const validate = require('djsv');
const schema = require('./schema');

class Server extends EventEmitter {

    constructor(options) {
        super();
        const setting = Object.assign({}, options.setting);
        const res = validate(schema.properties.setting, setting);
        if (!res.valid) {
            throw new Error(res.errors[0].stack);
        }
        this._consumer = new Consumer({setting: setting});
    }

    register(options) {
        options = options || {};
        const res = validate(schema, options);
        if (!res.valid) {
            throw new Error(res.errors[0].stack);
        }
        const opt = {
            job: {
                type: options.topic,
            },
            setting: {
                createClient: options.createClient
            }
        }
        this._consumer.register(opt);
        this._consumer.on('job', (request) => {
            this.emit('request', request);
        })
    }
}

module.exports = Server;