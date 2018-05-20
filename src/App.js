/*
    global saveAs, $
*/

import React from 'react';
import "./App.css";
import xlsx from "xlsx";
import Button from '@material-ui/core/Button';
import Chip from '@material-ui/core/Chip';
import LinearProgress from '@material-ui/core/LinearProgress';
import Upload from '@material-ui/icons/CloudUpload';
import Search from '@material-ui/icons/Search';
import Download from '@material-ui/icons/CloudDownload';
import Close from '@material-ui/icons/Close';

export default class App extends React.Component {
    constructor() {
        super();
        this.state = {
            loading: false,
            fileName: "Tên file",
            totalRows: 0,
            total: 0,
            ok: 0,
            fail: 0,
            excelFile: [],
            output: null,
            close: false
        }
        this.parser = new DOMParser();
        this.reader = new FileReader();
        this.reader.onload = (event) => {
            let binary = "";
            let bytes = new Uint8Array(event.target.result);
            let length = bytes.byteLength;
            for (let i = 0; i < length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            let wb = xlsx.read(binary, { type: 'binary', cellDates: true, cellStyles: true });
            let excelFile = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
            this.setState({
                totalRows: excelFile.length,
                fileName: event.target.fileName + ` (${excelFile.length} rows)`,
                excelFile: excelFile,
            })
        };
    }
    handleUploadFile = (event) => {
        this.setState({
            loading: false,
            fileName: "Tên file",
            totalRows: 0,
            total: 0,
            ok: 0,
            fail: 0,
            excelFile: {},
            output: null
        });
        let reg = /(.*?)\.(xlsx|xls|ods)$/;
        if (!event.target.files[0].name.match(reg)) {
            alert("Upload file tầm bậy rồi, mời up lại!!");
            event.target.value = "";
            return;
        }
        this.reader.fileName = event.target.files[0].name;
        this.reader.readAsArrayBuffer(event.target.files[0]);
    }

    handleDownloadFile = () => {
        if (!this.state.output) {
            alert("Chưa có gì để tải xuống, mời upload file excel và bấm nút truy xuất");
            return;
        }
        saveAs(this.state.output, "loc.xlsx");
    }

    convert = (results) => {
        let ws = xlsx.utils.json_to_sheet(results);
        let wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Loc");
        let output = xlsx.write(wb, { bookType: 'xlsx', type: 'binary' });
        this.setState({
            output: new Blob([this.s2ab(output)], { type: "application/octet-stream" }),
            loading: false
        });
    }

    s2ab = (s) => {
        let buf = new ArrayBuffer(s.length);
        let view = new Uint8Array(buf);
        for (let i = 0; i !== s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    }

    handleGetData = () => {
        if (this.state.excelFile.length === 0) {
            alert("Đã có gì đâu mà truy xuất, mời upload file excel!!");
            return;
        }
        this.setState({
            loading: true
        })
        let results = [];
        let excelFile = this.state.excelFile;
        let ok = 0;
        let fail = 0;
        let total = 0;
        let promises = excelFile.map(mst => {
            return fetch(`https://nopthue.gdt.gov.vn/epay_nnt/DkyBosung.do?TIN=${mst.MST}`, {
                method: "POST",
            })
                .then(result => result.text())
                .then(html => {
                    let tel = ($(html).find("[name=tel]").val()) ? $(html).find("[name=tel]").val() : "";
                    let email = ($(html).find("[name=email]").val()) ? $(html).find("[name=email]").val() : "";
                    if (!tel && !email) {

                    } else {

                    }
                    results.push({
                        MST: mst.MST + "",
                        "Số điện thoại": tel,
                        "Email": email
                    });
                    ok += 1;
                    total += 1;
                    this.setState({
                        ok: ok,
                        total: total
                    });
                })
                .catch(err => {
                    fail += 1;
                    total += 1;
                    this.setState({
                        fail: fail,
                        total: total
                    });
                });
        });

        Promise.all(promises)
            .then(() => {
                this.convert(results);
            })

    }

    handleClose = () => {
        this.setState({
            close: true
        })
    }

    render() {
        return (
            <div className={`dialog-container ${(this.state.close) ? "hide-dialog" : ""}`}>
                <input
                    id="upload-file"
                    style={{ display: "none" }}
                    type="file"
                    accept=".xlsx, .xls, .ods"
                    onChange={this.handleUploadFile}
                />
                <div className="upload-section">
                    <Button
                        className="upload-file-button"
                        onClick={() => { $("#upload-file").click(); }}
                        variant="raised"
                        disabled={this.state.loading}
                    >
                        TẢI LÊN&nbsp;<Upload />
                    </Button>
                    <br /><br />
                    <Chip label={this.state.fileName} />
                </div>
                <div className="get-data-section">
                    <Button
                        disabled={this.state.loading}
                        onClick={this.handleGetData}
                        variant="raised"
                        className="get-data-button"
                    >
                        TRUY XUẤT&nbsp;<Search />
                    </Button>
                    <div className="result-section">
                        <LinearProgress className={(this.state.loading) ? "" : "hide"} />
                        <span>Đã truy xuất: {this.state.total} / {this.state.totalRows}</span><br />
                        OK: {this.state.ok} <br />
                        Tạch: {this.state.fail} <br />
                    </div>
                </div >
                <div className="download-section">
                    <Button
                        onClick={this.handleDownloadFile}
                        disabled={this.state.loading}
                        className="download-file-button"
                        variant="raised"
                    >
                        TẢI XUỐNG&nbsp;<Download />
                    </Button>
                </div>
                <div>
                    <Button
                        disabled={this.state.loading}
                        onClick={this.handleClose}
                        className="close-button"
                        variant="raised"
                    >
                        ĐÓNG&nbsp;<Close />
                    </Button>
                </div>
                <div className="footer">
                    Tool truy xuất hàng loạt Email & Số ĐT từ Mã số thuế<br />
                    Tác giả: Nguyễn Anh Dũng - nguyenanhdung191@gmail.com
                </div>
            </div>
        );
    }
}