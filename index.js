let fs = require('fs')
let request = require('request');
let urlParse = require('url-parse')


let courseId = "015cda57e859ff8080815cd434d201cb"
let token = "015cda577f6fff8080815cd434d201c9"
let sld = "nice"
getFiles()
// saveFile()

function getFiles() {
    fs.readdir("./files/unfinished", (err, files) => {
        if (err) {
            return console.error(err);
        }
        files.forEach((file) => saveLecture(file))
    })
}

function saveFile() {
    let list = []
    fs.readFile("files/lecture.txt", (err, data) => {
        if (err) saveMsg("files/log.txt", err)
        if (data) {
            let line = data.toString().split("\r\n")
            line.forEach((l) => {
                let lecture = l.split("|")
                list.push({
                    id: lecture[0],
                    lecture_name: lecture[1]
                })
            })
        }
        list.forEach((lecture) => {
            let path = __dirname + "/files/unfinished/" + lecture.lecture_name;
            uploadFile(processUrl("/en/admin/lecture/video/save", {id: lecture.id}), path, lecture.lecture_name)
        })
        console.log(list)
    })
}

function saveLecture(path) {
    let fileName = path
    if (path.indexOf(".") !== -1) {
        fileName = path.substr(0, path.lastIndexOf("."))
    }
    let data = {
        lecture_name: fileName,
        abstract: "",
        lecture_type: "VIDEO",
        course_id: courseId
    }
    request.post({url: processUrl("/en/admin/lecture/save", data)}, (err, httpResponse, body) => {
        if (err) {
            saveMsg("log.text", new Date() + ":" + fileName + "|保存失败:" + err + "\r\n")
            return
        }
        let json = JSON.parse(body);
        if (!json.ok) {
            saveMsg("files/log.txt", new Date() + ":" + fileName + "|保存失败:" + json.msg + "\r\n")
            console.log(json.msg)
            return
        }
        console.log("保存成功:" + path)
        saveMsg('lecture.txt', json.data.id + "|" + path + "\r\n")
    });
}

function uploadFile(url, filePath, name) {
    let formData = {file: fs.createReadStream(filePath)};

    request.post({url, formData}, (err, httpResponse, body) => {
        if (err) saveMsg("files/log.txt", new Date() + ":" + filePath + "|上传失败:" + err + "\r\n")
        console.log(body)
        let json = JSON.parse(body);
        if (!json.ok) {
            saveMsg("files/log.txt", new Date() + ":" + filePath + "|保存失败:" + json.msg + "\r\n")
            console.log(json.msg)
            return
        }
        fs.rename(filePath, __dirname + '/files/finished/' + name, (err) => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log('移动成功')
            }
        )
    });
}

function saveMsg(text, msg) {
    fs.appendFile(text, msg, (err) => {
        if (err) throw err;
    })
}

function processUrl(url, paras) {
    const apiUrl = `http://api.123xue.cn${url}`
    const urlObj = urlParse(apiUrl, true)
    let query = urlObj.query || {}
    query.sld = sld
    query.access_token = token
    Object.assign(query, paras || {})
    return urlObj.toString()
}
