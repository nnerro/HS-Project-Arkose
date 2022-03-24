/*
  HS Softworks 2022
  ! neяo#5442
*/
//Set up server
const express = require("express");
const app = express();

const fp = require("fp");
const fun = require("./api");
const phin = require("phin");
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

app.get("/", async (req, res) => {
  let username = 'HS_' + require("crypto").randomBytes(8).toString("hex");
  let password = require("crypto").randomBytes(10).toString("hex")
  if (password == undefined){
    setTimeout(() => {
      while (true){
        password = require("crypto").randomBytes(10).toString("hex")
        if (password != undefined){
          break
        }
      }
    }, 100)
  }
  await genUsername(username, password).then(async validName => {
    let username = validName
    await solveCaptcha(username, password).then(async data => {
      let csrf = data[0];
      let id = data[1];
      let token = data[2];
      res.send(`<iframe frameborder="0" scrolling="no" id="fc-iframe-wrap" class="fc-iframe-wrap" aria-label=" " src="https://roblox-api.arkoselabs.com/fc/gc/?token=${token.split("|")[0]}&amp;r=us-east-1&amp;metabgclr=transparent&amp;guitextcolor=%23474747&amp;maintxtclr=%23b8b8b8&amp;metaiconclr=transparent&amp;meta=6&amp;pk=A2A14B1D-1AF3-C791-9BBC-EE33CC7A0A6F&amp;at=40&amp;ht=1&amp;atp=2&amp;cdn_url=https%3A%2F%2Froblox-api.arkoselabs.com%2Fcdn%2Ffc&amp;lurl=https%3A%2F%2Faudio-us-east-1.arkoselabs.com&;surl=https%3A%2F%2Froblox-api.arkoselabs.com" style="width: 308px; height: 252px;"></iframe><form action="/" method="POST"><input type="hidden" name="csrf" value=${csrf}><input type="hidden" name="id" value=${id}><input type="hidden" name="token" value=${token}><input type="hidden" name="username" value=${username}><input type="hidden" name="password" value=${password}><input type="submit" value="Sign Up"></form>`);
    }).catch(err => {
      res.send(`<h1>${err}</h1><br><form action="/" method="GET"><input type="submit" value="Restart"></form>`)
    })
  }).catch(err => {
    res.send(`<h1>${err}</h1><br><form action="/" method="GET"><input type="submit" value="Restart"></form>`)
  })
});
app.use(express.urlencoded({ extended: true }));
app.post("/", (req, res) => {
  signUp(req.body.csrf, req.body.id, req.body.token, req.body.username, req.body.password).then(success => {
    res.send(`<h1>Username: ${req.body.username}<br>Password: ${req.body.password}</h1><br><p>${success}</p><form action="/" method="GET"><input type="submit" value="Restart"></form>`);
  }).catch(err => {
    res.send(`<h1>${err}</h1><br><form action="/" method="GET"><input type="submit" value="Restart"></form>`)
  })
});
app.listen(process.env.PORT || 3000);

async function genUsername(username, password) {
  return new Promise(async (resolve, reject) => {
    await phin({
      url: "https://auth.roblox.com/v1/usernames/validate",
      method: "POST"
    }).then(async csrf => {                   
      csrf = csrf.headers["x-csrf-token"];
      let request = await phin({
        url: "https://auth.roblox.com/v1/usernames/validate",
        method: "POST",
        headers: {
          "x-csrf-token": csrf,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
          "Content-Type": "application/json"
        },
        data: {
          "username": username,
          "context": "Signup",
          "birthday": `${Math.floor(Math.random() * (Math.floor(2002) - Math.ceil(1980) + 1)) + Math.ceil(1980)}-${Math.floor(Math.random() * (Math.floor(12) - Math.ceil(1) + 1)) + Math.ceil(1)}-${Math.floor(Math.random() * (Math.floor(28) - Math.ceil(10) + 1)) + Math.ceil(10)}T05:00:00.000Z`
        }
      });
      let response = JSON.parse(request.body.toString());
      if (response.message == "Username is valid") {
        console.log(response.message)
        console.log(`Username: ${username}`);
        console.log(`Password: ${password}`);
        resolve(username);
      } else {
        let username = 'HS_' + require("crypto").randomBytes(8).toString("hex");
        await genUsername(username);
      }
    })
  })
}

async function doCaptcha(blob) {
  let token = await fun.getToken("A2A14B1D-1AF3-C791-9BBC-EE33CC7A0A6F", blob);
  return token.token;
};

async function solveCaptcha(username, password) {
  return new Promise(async (resolve, reject) => {
    await phin({
      url: "https://auth.roblox.com/v2/signup",
      method: "POST"
    }).then(async csrf => {
      csrf = csrf.headers["x-csrf-token"];
      let fieldData = await phin({
        url: 'https://auth.roblox.com/v2/signup',
        method: 'POST',
        headers: {
          "x-csrf-token": csrf,
        },
        data: {
          username,
          password,
          birthday: `${(Math.floor(Math.random() * 30) + 1).toString().padStart(2, 0)} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Math.floor(Math.random() * 12)]} ${(Math.floor(Math.random() * 40) + 1980)}`,
          gender: Math.floor(Math.random() * 3) + 1,
          isTosAgreementBoxChecked: true,
          context: "MultiverseSignupForm",
          referralData: null,
          abTestVariation: 0,
          displayAvatarV2: false,
          displayContextV2: false,
          agreementIds: ["54d8a8f0-d9c8-4cf3-bd26-0cbf8af0bba3", "848d8d8f-0e33-4176-bcd9-aa4e22ae7905"]
        }
      })
      if (JSON.parse(fieldData.body.toString()).errors[0].message == "TooManyRequests") {
        reject("Too many requests.")
      } else {
        fieldData = JSON.parse(fieldData.body.toString()).errors[0].fieldData
        let captchaId = fieldData.split(",")[0]
        let blob = fieldData.split(",")[1]
        let captchaToken = await doCaptcha(blob);
        resolve([csrf, captchaId, captchaToken]);
      }
    })
  })
};

async function signUp(csrf, id, token, username, password) {
  return new Promise(async (resolve, reject) => {
    let response = await phin({
      url: 'https://auth.roblox.com/v2/signup',
      method: 'POST',
      headers: {
        "x-csrf-token": csrf,
      },
      data: {
        username,
        password,
        birthday: `${(Math.floor(Math.random() * 30) + 1).toString().padStart(2, 0)} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Math.floor(Math.random() * 12)]} ${(Math.floor(Math.random() * 40) + 1980)}`,
        gender: Math.floor(Math.random() * 3) + 1,
        isTosAgreementBoxChecked: true,
        context: "MultiverseSignupForm",
        referralData: null,
        abTestVariation: 0,
        displayAvatarV2: false,
        displayContextV2: false,
        agreementIds: ["54d8a8f0-d9c8-4cf3-bd26-0cbf8af0bba3", "848d8d8f-0e33-4176-bcd9-aa4e22ae7905"],
        captchaId: id,
        captchaToken: token,
        captchaProvider: "PROVIDER_ARKOSE_LABS"
      }
    })
    if (JSON.parse(response.body.toString()).hasOwnProperty("errors")){
      reject("Please solve the captcha first!");
    } else {
      console.log(JSON.parse(response.body.toString()));
      resolve(response.body.toString());
    }
  })
};