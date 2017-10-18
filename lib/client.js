const { Producer } = require('raf-tasq');
const validate = require('djsv');
const schema = require('./schema');

class Client {

    /**
     * 
     * @param {*} options 
     * 
     */
    constructor(options) {
        const setting = Object.assign({}, options.setting);
        const res = validate(schema.properties.setting, setting);
        if (!res.valid) {
            throw new Error(res.errors[0].stack);
        }
        this._producer = new Producer({setting: setting});
    }

    async request(options) {
        options = options || {};
        const res = validate(schema, options);
        if (!res.valid) {
            throw new Error(res.errors[0].stack);
        }
        const opt = {
            job: {
                type: options.topic,
                data: options.data,
                waitingTimeout: options.timeout,
                resolveOnComplete: true
            },
            queue: {
                removeOnComplete: false,
                removeOnFail: false
            }
        }
        const reply = await this._producer.createJob(opt);
        return reply.result;
    }
}

module.exports = Client;