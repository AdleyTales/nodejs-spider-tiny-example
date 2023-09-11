const axios = require('axios')
// const cheerio = require('cheerio')
const url = require('url')
const mysql = require('mysql2')



const GEN_URL = (query = {}) => {
	return url.format({
		protocol: 'https',
		hostname: 'api.mdnice.com',
		pathname: '/writings',
		query
	})
}

async function sleep(t) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve(true)
		}, t * 1000)
	})
}

async function getApiData(currentPage = 1, categoryCode = 'backend', pageSize = 50) {
	try {
		const _url = GEN_URL({
			currentPage,
			pageSize,
			categoryCode
		})
		const res = await axios.get(_url)
		return res.data.data
	} catch (e) {
		console.error(e)
	}
}

async function addDataIntoDB(data = [], connection) {
	const _data = data.map(item => {
		const {
			category,
			readingNum,
			headPic,
			title,
			createTime,
			publishTime,
			upToNow,
			updateTime,
			username,
			outId
		} = item

		return [
			null,
			category,
			readingNum,
			headPic,
			title,
			createTime,
			publishTime,
			upToNow,
			updateTime,
			username,
			outId
		]
	})

	return new Promise((resolve, reject) => {
		connection.query('INSERT INTO `modi`(id,category,readingNum,headPic,title,createTime,publishTime,upToNow,updateTime,username,outId) VALUES ?', [_data], function (err, result) {
			if (err) {
				reject(err)
			} else {
				resolve(true)
			}
		})
	})
}


async function doSpider(categoryCode) {
	let currentPage = 19
	const pageSize = 100

	// 创建一个数据库连接
	const connection = await mysql.createConnection({
		host: 'localhost',
		user: 'root',
		password: 'root',
		database: 'modi'
	});

	console.log(`---------------------- 【${categoryCode}】开始爬取 ----------------------`);

	try {
		while (true) {
			const res = await getApiData(currentPage, categoryCode, pageSize)
			// db
			await addDataIntoDB(res, connection)
			console.log(`入库成功: ${currentPage * pageSize}条！，当前页：${currentPage} ...`)

			if (res.length < pageSize) {
				console.log(`---------------------- 【${categoryCode}】爬取结束！ 当前页条数为： ${res.length} ----------------------`);
				break
			} else {
				currentPage++
				await sleep(0.8)
			}
		}
	} catch (e) {
		console.error('插入失败: ', e)
	}
}

async function main() {
	const categoryCodes = [
		'frontend',
		'ai',
		'mobile',
		'math',
		'design',
		'literature',
		'read',
		'tool',
		'other',
		'backend',
	]

	for (const categoryCode of categoryCodes) {
		await doSpider(categoryCode)
	}
}

main()