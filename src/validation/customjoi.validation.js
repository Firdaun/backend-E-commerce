import joiBase from 'joi'
import sanitizeHtml from 'sanitize-html'

export const Joi = joiBase.extend((joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.xss': '{{#label}} detected containing malicious HTML/Script tags'
    },
    rules: {
        antiXSS: {
            validate(value, _) {
                const cleanText = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {}
                })

                return cleanText
            }
        }
    }
}))