const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

app.set('views', path.join(__dirname, './web'));
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

app.get('/', (req, res) => {
	res.render('index.html');
});
app.get('/archives/superipm.jpg', (req, res) => {
	res.sendFile(path.join(__dirname, './web/archivos/logo-superipm.png'));
})

app.get('/dashboard', (req, res) => {
	const code = req.query.code;
	if (code) {
		const oauthResult = fetch('https://discord.com/api/oauth2/token', {
			method: 'POST',
			body: new URLSearchParams({
				client_id: '855875300259528735',
				client_secret: 'R80jF_XxRdkTKA1KJ_dkkQl9fGL7vxeF',
				code,
				grant_type: 'authorization_code',
				redirect_uri: `http://127.0.0.1:${app.get('port')}/dashboard`,
				scope: 'guilds',
			}),
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		});
		oauthResult.then((data) => {
			console.log(data);
		})
		// const oauthData = oauthResult.json();
		// console.log(oauthData);
	}

	return res.render('dashboard.html');
});

app.use((req, res) => {
	res.status(400).send({ reponse: 'Failed, not found de page', code: 404 });
});

app.listen(1000, () => {
	console.log('server on port 1000');
});

module.exports = {app};