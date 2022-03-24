let http = require("./http")
let session = require("./session")
let util = require("./util")

function getToken(publicKey, blob) {
    return new Promise(async a => {
        a(JSON.parse(await http({
            url: "https://roblox-api.arkoselabs.com/fc/gt2/public_key/" + publicKey,
            method: "POST",
            body: util.constructFormData({
                bda: await util.get_bda(),
                public_key: publicKey,
                "data[blob]": blob,
            }),
            headers: {
                "User-Agent": util.USERAGENT,
                "Content-Type": "application/x-www-form-urlencoded"
            }
        })))
    })
}

module.exports = {getToken}