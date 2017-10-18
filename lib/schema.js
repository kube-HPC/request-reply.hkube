module.exports = {
    "name": "options",
    "type": "object",
    "properties": {
        "topic": {
            "type": "string",
            "required": true,
            "description": "the request topic"
        },
        "timeout": {
            "type": "integer",
            "description": "time wait before the req-rep completed",
            "default": 15000
        },
        "setting": {
            "type": "object",
            "properties": {
                "queueName": {
                    "type": "string",
                    "default": "req-rep-queue",
                    "description": "the queue name"
                },
                "prefix": {
                    "type": "string",
                    "default": "req-rep-jobs",
                    "description": "prefix for all queue keys"
                }
            }
        }
    }
}