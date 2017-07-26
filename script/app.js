/**
 * Created by jason on 27/06/2017.
 *
 */
let urlParse = require('url-parse')
let $ = require('jquery')

new Vue({
    el: '#app',
    data(){
        return {
            files: [],
            token: null,
            courseId: '',
            sld: 'jinying',
            account: null,
            pwd: null
        }
    },
    mounted(){
        let component = this
        component.$nextTick(() => {
            $(document).ajaxError((event, xhr) => {
                if (xhr.status === 401) {
                    alert("token过期,请更换")
                    component.token = null
                }
            })
        })
    },
    watch: {
        token(val){
            if (val) {
                this.$nextTick(() => {
                    this.initUpload()
                    this.files = []
                })
            }
        }
    },
    methods: {
        allowDrop(event){
            event.preventDefault()
        },
        drag(item, index){
            this.item = item
            this.selectIndex = index
        },
        drop(event, to){
            event.preventDefault()
            const form = this.files.indexOf(this.item)
            this.files.splice(form, 1)
            this.files.splice(to, 0, this.item)
        },
        selectFile(){
            this.$refs.picker.click()
        },
        initUpload(){
            let component = this
            component.uploader = new plupload.Uploader({
                runtimes: 'html5',
                browse_button: "picker", // you can pass an id...
                filters: {
                    mime_types: [
                        {title: "video files", extensions: "flv,avi,mpg,mp4,wmv,3gp,mov,asf"}
                    ]
                },
                init: {
                    FilesAdded: function (up, files) {
                        console.log(files)
                        files.forEach((file) => {
                            let lecture_name = file.name
                            if (lecture_name.lastIndexOf(".") !== -1) {
                                lecture_name = lecture_name.substr(0, lecture_name.lastIndexOf("."))
                            }
                            component.files.push({
                                name: lecture_name,
                                size: plupload.formatSize(file.size),
                                lectureId: null,
                                fileId: file.id,
                                abstract: null,
                                percent: 0,
                                msg: null
                            })
                        });
                    },

                    UploadProgress: function (up, file) {
                        let f = component.findFileById(file.id)
                        f.percent = file.percent
                    },
                    BeforeUpload: function (up, file) {
                        let f = component.findFileById(file.id)
                        if (!f.lectureId) {
                            f.msg = '请先保存'
                            return
                        }
                        up.getOption().url = component.processUrl("/en/admin/lecture/video/save", {id: f.lectureId})
                    },
                    FileUploaded: function (up, file, result) {
                        let f = component.findFileById(file.id)
                        if (result.status !== 200) {
                            f.msg = `出错:${result.status}`
                            return
                        }
                        const json = JSON.parse(result.response)
                        if (!json.ok) {
                            f.msg = `出错:${json.msg}`
                            return
                        }
                        f.msg = "上传成功"
                    }
                }
            });
            component.uploader.init();
        },
        login(){
            if (!this.sld || !this.account || !this.pwd) {
                alert("一个都不能少！")
                return
            }
            let component = this
            $.ajax({
                url: component.processUrl("/en/auth/access_token/create"),
                type: "post",
                data: {
                    account: component.account,
                    pwd: component.pwd
                },
                success(json){
                    if (json.ok) {
                        component.token = json.data.id
                        return
                    }
                    alert(json.msg)
                },
                error(err){
                    alert(JSON.stringify(err))
                }
            })
        },
        saveLecture(){
            let component = this
            this.files.forEach((file) => {
                if (!file.lectureId) {
                    $.ajax({
                        url: component.processUrl("/en/admin/lecture/save"),
                        type: "post",
                        data: {
                            course_id: component.courseId,
                            lecture_name: file.name,
                            abstract: file.abstract,
                            lecture_type: "VIDEO"
                        },
                        success(json){
                            if (json.ok) {
                                file.lectureId = json.data.id
                                return
                            }
                            file.msg = json.msg
                        },
                        error(err){
                            file.msg = JSON.stringify(err)
                        }
                    })
                }
            })
        },
        processUrl(url, paras) {
            const apiUrl = `https://api.kuaike.cn${url}`
            const urlObj = urlParse(apiUrl, true)
            let query = urlObj.query || {}
            query.sld = this.sld
            query.access_token = this.token
            Object.assign(query, paras || {})
            return urlObj.toString()
        },
        startUpload(){
            this.uploader.start();
        },
        findFileById(id){
            let file = null
            this.files.forEach((f) => {
                if (f.fileId === id) {
                    file = f
                }
            })
            return file
        },
        close(){
            window.close()
        }
    }
})