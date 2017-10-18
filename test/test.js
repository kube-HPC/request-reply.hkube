const { expect } = require('chai');
const Redis = require('ioredis');
const { Client, Server } = require('../index');

const redisHost = process.env.REDIS_CLUSTER_SERVICE_HOST || '127.0.0.1';
const redisPort = process.env.REDIS_CLUSTER_SERVICE_PORT || 6379;
const useCluster = process.env.REDIS_CLUSTER_SERVICE_HOST ? true : false;
const redisConfig = { host: redisHost, port: redisPort };

const globalOptions = {
    topic: 'test-req-rep',
    data: { action: 'bla' },
    timeout: 15000,
    createClient: function (type) {
        return createClient();
    }
}

function createClient() {
    return useCluster ? new Redis.Cluster([redisConfig]) : new Redis(redisConfig)
}

describe('Test', function () {
    describe('Client', function () {
        describe('Validation', function () {
            it('should throw validation error is not typeof', function (done) {
                const options = {
                    topic: 'test-job',
                    timeout: 'bla'
                };
                const client = new Client(options);
                client.request(options).catch((error) => {
                    expect(error.message).to.equal('instance.timeout is not of a type(s) integer');
                    done();
                });
            });
            it('should throw validation error with topic is required', function (done) {
                const options = {};
                const client = new Client(options);
                client.request(options).catch((error) => {
                    expect(error.message).to.equal('instance.topic is required');
                    done();
                });
            });
        });
        describe('Request', function () {
            it('should create request and get reply', async function () {
                const data = { action: 'bla' };
                const options = {
                    topic: 'test-req-rep-success',
                    data: data,
                    createClient: function (type) {
                        return useCluster ? new Redis.Cluster([redisConfig]) : new Redis(redisConfig)
                    }
                }
                const server = new Server(options);
                server.register(options);
                server.on('request', (request) => {
                    request.done(null, data);
                });
                const client = new Client(options);
                const reply = await client.request(options)
                expect(reply).to.deep.equal(data);
            });
            it('should create request without reply', async function () {
                this.timeout(5000);
                let reply = null;
                const options = {
                    topic: 'test-req-rep-failed',
                    data: { action: 'bla' },
                    timeout: 2000,
                    createClient: globalOptions.createClient
                }
                const client = new Client(options);
                client.request(options).catch((error) => {
                    expect(error.message).to.equal('job-waiting-timeout');
                });
            });
            it('should create two differnt requests', async function () {
                const options = {};
                const options1 = {
                    topic: 'test-job-1',
                    data: { action: 'test-1' },
                    createClient: globalOptions.createClient
                }
                const options2 = {
                    topic: 'test-job-2',
                    data: { action: 'test-2' },
                    createClient: globalOptions.createClient
                }
                const res = { success: 'consumer-result-1' };
                const server = new Server(options);
                server.register(options1);
                server.register(options2);
                server.on('request', (request) => {
                    request.done(null, res);
                });

                const client = new Client(options);
                const results = await Promise.all([client.request(options1), client.request(options2)]);
                expect(results[0]).to.deep.equal(res);
                expect(results[1]).to.deep.equal(res);
            });
        });
    });
    describe('Server', function () {
        describe('Validation', function () {
            it('should throw validation error is not typeof', function () {
                const options = {};
                const server = new Server(options);
                const func = () => server.register(options)
                expect(func).to.throw(Error, 'instance.topic is required');
            });
        });
        describe('Reply', function () {
            it('should consume a job with properties', function (done) {
                const options = {};
                const client = new Client(options);
                const server = new Server(options);
                server.on('request', (request) => {
                    expect(request).to.have.property('data');
                    expect(request).to.have.property('done');
                    expect(request).to.have.property('topic');
                    done();
                });
                server.register(globalOptions);
                client.request(globalOptions);
            });
        });
    });
    describe('Stress', function () {
        describe('CreateJob', function () {
            it('should create job multiple times and set of results', function (done) {
                const options = {
                    topic: 'stress-test-req-rep',
                    data: { action: 'test' },
                    createClient: globalOptions.createClient
                }
                const client = new Client(options);
                const server = new Server(options);
                server.on('request', (request) => {
                    request.done(null, { data: 'ok' })
                });
                server.register(options);
                const num = 100;
                const range = Array.from({ length: num }, (value, key) => (key + 1).toString())
                const promises = range.map(() => client.request(options));
                Promise.all(promises).then((result) => {
                    expect(result).to.have.lengthOf(num);
                    done();
                })
            });
        });
    });
});