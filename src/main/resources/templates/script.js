//childrenとかgetElementsByClassNameとかで返ってくるHTML要素の配列の子要素ごとに実行する関数
HTMLCollection.prototype.forEach = function(fn) {
    for (let i = 0, l = this.length; i < l; i++) {
        fn(this[i]);
    }
};

// 【見てごらん】datetime-localのvalueから年、月、日、時間、分とかをそれぞれ個別に取得できる正規表現の強点
const DATETIME_LOCAL_REGEX = /((\d{4})-((?:0[1-9])|(?:1[0-2]))-((?:0[1-9])|(?:[12]\d)|(?:3[01])))(?:T((?:[01]\d)|(?:2[0-3])):((?:[0-5]\d)))?/;

function zeroPadding(n) {
    return (n < 10 ? "0" : "") + n;
}

// 引数dateの月のカレンダーのHTMLの生成する関数
function createCalenderHtml(date) {
    const WEEK_STR_ARR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    //一週間は何日あるかの定数
    const WEEK_COUNT = 7;
    //一か月に何週間あるかの定数
    const MONTH_WEEKS_COUNT = 6;

    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth() + 1;

    //月の最初の日付
    const monthStartDate = new Date(currentYear, currentMonth - 1, 1);
    //月の最後の日付
    //(currentMonth + 1)月の0日目 => currentMonthの最終日
    const monthEndDay = new Date(currentYear, currentMonth, 0);

    //前月の最後の日付
    //(currentMonth)月の0日目 => 前月の最終日
    const lastMonthEndDate = new Date(currentYear, currentMonth - 1, 0);

    const endDayCount = monthEndDay.getDate();
    const monthStartDay = monthStartDate.getDay();

    let dayCount = 1;
    let calenderHtml = "";

    calenderHtml += `<h1>${currentYear}/${zeroPadding(currentMonth)}</h1>`;
    calenderHtml += "<table>";

    //Sun. ~ Sat. のやつ
    calenderHtml += "<tr>";
    for (let i = 0; i < WEEK_COUNT; i++) {
        calenderHtml += `<th>${WEEK_STR_ARR[i]}.</th>`;
    }
    calenderHtml += "</tr>";


    for (let i = 0; i < MONTH_WEEKS_COUNT; i++) {
        calenderHtml += "<tr>";

        for (let j = 0; j < WEEK_COUNT; j++) {
            if (i === 0 && j < monthStartDay) {
                //月の最初の週かつ、月の始まりの曜日の前なら
                const num = lastMonthEndDate.getDate() - monthStartDay + j + 1;
                calenderHtml += `<td class="is-disabled">${num}</td>`;
            } else if (dayCount > endDayCount) {
                //月の
                const num = dayCount - endDayCount;
                calenderHtml += `<td class="is-disabled">${num}</td>`;
                dayCount++;
            } else {
                calenderHtml += `<td data-date="${currentYear}-${zeroPadding(currentMonth)}-${zeroPadding(dayCount)}">${dayCount}</td>`;
                dayCount++;
            }
        }

        calenderHtml += "</tr>";
    }
    return calenderHtml;
}

// calenderがボタンが押されたなどして更新されたときに実行される関数
function onUpdateCalender() {
    const undoneList = document.getElementById("undoneList");

    const calenderDate = calenderController.getCurrentDate();

    // ******** めっちゃ重要ポイント **********
    // UndoneListよりも先にDoneListを組み立てる（？）ことによりUndoneListのカレンダーの色付けを優先的にできる
    // **************************************
    buildDoneTaskList(calenderDate);
    buildUndoneTaskList(calenderDate);

    document.getElementsByClassName("js-calender-date").forEach((e) => {
        e.innerText = `${calenderDate.getFullYear()}/${zeroPadding(calenderDate.getMonth() + 1)}`;
    });
}

// undoneList, doneListのtaskのdatetime-localの値を読み取り、calenderにそれぞれ色をつける関数
// dateStr: "YYYY-MM-DD"
// markType: 0: Undone, 1: Done
function markCalender(dateStr, markType) {
    const calenderDate = document.getElementById("dynamicCalender").querySelector(`td[data-date='${dateStr}']`);

    if (calenderDate) {
        switch (markType) {
            //Undone
            case 0: {
                calenderDate.style.backgroundColor = "#ee00007f";
                break;
            }

            //Done
            case 1: {
                calenderDate.style.backgroundColor = "#00ff007f";
                break;
            }

            default: break;
        }
    }
}

// actualUndoneListからundoneTaskListを組み立てる関数
function buildUndoneTaskList(date) {
    const actualUndoneList = document.getElementById("actualUndoneList");
    const undoneListDisplayer = document.getElementById("undoneListDisplayer");

    let undoneListHtml = "";
    
    actualUndoneList.children.forEach((child) => {
        const taskName = child.querySelector("input[name=title]").value;
        const timeLimit = child.querySelector("input[name=time_limit]").value;
        const doneFlg = child.querySelector("input[name=done_flg]").value;
        const taskId = child.querySelector("input[name=id]").value;
        
        const [matched, matchedDate, year, month, day, hour, min] = DATETIME_LOCAL_REGEX.exec(timeLimit).map((e) => {
            return /^\d+$/.test(e) ? Number.parseInt(e) : e;
        });

        if (year === date.getFullYear() && month === (date.getMonth() + 1)) {
            undoneListHtml += `<li class="task" data-id="${taskId}" data-doneFlg="${doneFlg}" data-fullTimeLimit="${matched}">`;
            undoneListHtml += `<p class="task-title">${taskName || "タイトル未設定"}</p>`;
            undoneListHtml += `<p class="task-time-limit">Time Limit: ${zeroPadding(day)}日${zeroPadding(hour)}時${zeroPadding(min)}分`;
            undoneListHtml += `</li>`;

            // matchedDateでundoneでカラー染める（？）
            markCalender(matchedDate, 0);
        }
    });

    if (undoneListHtml === "") {
        undoneListHtml= `<p class="task-not-found-message">現在タスクは登録されていません<br>今月は自由です！</p>`;
    }

    undoneListDisplayer.innerHTML = undoneListHtml;

    undoneListDisplayer.children.forEach((task) => {
        task.addEventListener("click", (ev) => {
            // currenttargetでevent発生元の要素を取得できるらしい
            popupController.showUpdateTaskPopup(ev.currentTarget);
        });
    });
}

//actualDoneListからdoneTaskListを組み立てる関数
function buildDoneTaskList(date) {
    const actualDoneList = document.getElementById("actualDoneList");
    const doneListDisplayer = document.getElementById("doneListDisplayer");

    let doneListHtml = "";
    
    actualDoneList.children.forEach((child) => {
        const taskName = child.querySelector("input[name=title]").value;
        const timeLimit = child.querySelector("input[name=time_limit]").value;
        const doneFlg = child.querySelector("input[name=done_flg]").value;
        const taskId = child.querySelector("input[name=id]").value;
        
        const [matched, matchedDate, year, month, day, hour, min] = DATETIME_LOCAL_REGEX.exec(timeLimit).map((e) => {
            return /^\d+$/.test(e) ? Number.parseInt(e) : e;
        });

        if (year === date.getFullYear() && month === (date.getMonth() + 1)) {
            doneListHtml += `<li class="task" data-id="${taskId}" data-doneFlg="${doneFlg}" data-fullTimeLimit="${matched}">`;
            doneListHtml += `<p class="task-title">${taskName || "タイトル未設定"}</p>`;
            doneListHtml += `<p class="task-time-limit">Time Limit: ${zeroPadding(day)}日${zeroPadding(hour)}時${zeroPadding(min)}分`;
            doneListHtml += `</li>`;

            // matchedDateでdoneでカラー染める（？）
            markCalender(matchedDate, 1);
        }
    });

    if (doneListHtml === "") {
        doneListHtml = `<p class="task-not-found-message">現在完了済みのタスクはありません<br>タスクを達成してから遊びましょう！</p>`;
    }

    doneListDisplayer.innerHTML = doneListHtml;

    doneListDisplayer.children.forEach((task) => {
        task.addEventListener("click", (ev) => {
            // currenttargetでevent発生元の要素を取得できるらしい
            popupController.showUpdateTaskPopup(ev.currentTarget);
        });
    });
}

class CalenderController {
    constructor() {
        //変数nowとメンバ変数nowとメンバ変数currentDateを同時に初期化
        const now = this.now = this.currentDate = new Date();
        this.monthOffset = 0;

        document.getElementById("dynamicCalender").innerHTML = createCalenderHtml(now);
    }

    // メンバ変数currentDateをそのまま返す
    getCurrentDate() {
        return this.currentDate;
    }

    // カレンダーを現在の一か月前にセットする
    setCalenderLastMonth() {
        this.monthOffset--;
        const year = this.now.getFullYear();
        const month = this.now.getMonth();
        const currentDate = this.currentDate = new Date(year, month + this.monthOffset);

        document.getElementById("dynamicCalender").innerHTML = createCalenderHtml(currentDate);
    }

    // カレンダーを減在の一か月後にセットする
    setCalenderNextMonth() {
        this.monthOffset++;
        const year = this.now.getFullYear();
        const month = this.now.getMonth();
        const currentDate = this.currentDate = new Date(year, month + this.monthOffset);

        document.getElementById("dynamicCalender").innerHTML = createCalenderHtml(currentDate);
    }
}

// DoneListとUndoneListの表示を切り替えるクラス
class ContainerWrapperController {
    constructor() {
        /*
        0: undoneListが表示されている
        1: doneListが表示されている
        */
        this.state = 0;

        document.getElementById("doneWrapper").classList.add("hidden-container-wrapper");
    }

    // 未完了のタスクを表示させる
    showUndoneList() {
        if (this.state !== 0) {
            const undoneWrapper = document.getElementById("undoneWrapper");
            const doneWrapper = document.getElementById("doneWrapper");

            if (undoneWrapper && doneWrapper) {
                undoneWrapper.classList.remove("hidden-container-wrapper");
                doneWrapper.classList.add("hidden-container-wrapper");
                this.state = 0;
            }
        } else {
            console.warn("undoneListはすでに表示されています。");
        }
    }

    // 完了済みのタスクを表示させる
    showDoneList() {
        if (this.state !== 1) {
            const undoneWrapper = document.getElementById("undoneWrapper");
            const doneWrapper = document.getElementById("doneWrapper");

            if (undoneWrapper && doneWrapper) {
                undoneWrapper.classList.add("hidden-container-wrapper");
                doneWrapper.classList.remove("hidden-container-wrapper");
                this.state = 1;
            }
        } else {
            console.warn("doneListはすでに表示されています。");
        }
    }
}

class PopupController {
    constructor() {
        /*
        0: 何もポップアップされていない
        1: 設定が表示されている
        2: タスク編集が表示されている
        3: タスク追加が表示されている
        */
        this.state = 0;

        const popupContainer = this.popupContainer = document.getElementById("popupContainer");
        popupContainer.style.display = "none";

        // ポップアップ時の後ろのくろいやつをクリックしたらポップアップを隠すイベントの追加
        const _this = this;
        document.getElementById("popupBack").addEventListener("click", (_e) => {
            _this.hidePopup();
        });
    }

    // popupを隠す
    hidePopup() {
        if (this.state !== 0) {
            this.popupContainer.style.display = "none";
            this.state = 0;
        }
    }

    // 設定ポップアップを表示し、stateを1にする
    showSettingsPopup() {
        if (this.state === 0) {
            document.getElementById("popupForm").innerHTML = `
                <div class="popup-form-item">
                    <h3>背景画像</h3>
                    <input type="file" name="gazou" accept="image/*" required />
                </div>

                <div class="popup-form-item">
                    <input type="submit" value="登録" />
                </div>
            `;

            document.getElementById("popupTitle").innerText = "背景画像の追加";

            document.getElementById("popupForm").action = location.href + "background_image";

            document.getElementById("todoPopup").style.display = "flex";
            this.popupContainer.style.display = "block";
            this.state = 1;
        }
    }

    // タスク編集ポップアップを表示し、stateを2にする
    showUpdateTaskPopup(task) {
        if (this.state === 0) {
            if (task instanceof HTMLLIElement && "id" in task.dataset) {
                const popupForm = document.getElementById("popupForm");
                const taskDoneFlg = task.dataset.doneflg;
                const taskId = task.dataset.id;
                const taskTitle = task.getElementsByClassName("task-title")[0].innerHTML;
                const taskTimeLimit = task.dataset.fulltimelimit;

                let popupFormHtml = "";

                popupFormHtml = `
                    <input type="hidden" name="id" value="${taskId}">
                    <div class="popup-form-item">
                        <h3>タスクの名前</h3>
                        <input type="text" name="title" placeholder="タスクの名前" value="${taskTitle}" required />
                    </div>
                    <div class="popup-form-item">
                        <label for="done_flg">タスクが終わったかどうか</label>
                        <input type="checkbox" name="done_flg" id="done_flg" ${Number.parseInt(taskDoneFlg) === 1 ? "checked" : ""} value="${taskDoneFlg}" id="popupFormDoneFlgCheckbox" onchange="this.value=this.checked?'1':'0'"/>
                    </div>

                    <div class="popup-form-item">
                        <h3>タスクをいつまでに終わらせるか</h3>
                        <small>カレンダーのアイコンをクリックして詳細に編集します</small>
                        <input type="datetime-local" name="time_limit" value="${taskTimeLimit}" required />
                    </div>

                    <div class="popup-form-item">
                        <input type="submit" value="更新" />
                    </div>
                `;

                popupForm.innerHTML = popupFormHtml;

                document.getElementById("popupTitle").innerText = "タスクを編集";

                popupForm.action = location.href + "update";
                
                this.popupContainer.style.display = "block";
                this.state = 2;
            }
        }
    }

    // タスク追加ポップアップを表示し、stateを3にする
    showAddTaskPopup() {
        if (this.state === 0) {
            document.getElementById("popupForm").innerHTML = `
                <div class="popup-form-item">
                    <h3>タスクの名前</h3>
                    <input type="text" name="title" placeholder="タスクの名前" required />
                </div>

                <div class="popup-form-item">
                    <h3>タスクをいつまでに終わらせるか</h3>
                    <small>カレンダーのアイコンをクリックして詳細に編集します</small>
                    <input type="datetime-local" name="time_limit" required />
                </div>

                <div class="popup-form-item">
                    <input type="submit" value="追加" />
                </div>
            `;

            document.getElementById("popupTitle").innerText = "タスクを追加";

            document.getElementById("popupForm").action = location.href + "add";

            document.getElementById("todoPopup").style.display = "flex";
            this.popupContainer.style.display = "block";

            this.state = 3;
        }
    }
}

// それぞれのcontrollerのインスタンスを生成
const calenderController = new CalenderController();
const containerWrapperController = new ContainerWrapperController();
const popupController = new PopupController();

// それぞれのボタンにcontrollerのメソッドを呼び出すイベントを追加
document.getElementById("showUndoneList").addEventListener("click", (_e) => {
    containerWrapperController.showUndoneList();
});
document.getElementById("showDoneList").addEventListener("click", (_e) => {
    containerWrapperController.showDoneList();
});

document.getElementById("addTaskButton").addEventListener("click", (_e) => {
    popupController.showAddTaskPopup();
});

document.getElementById("setCalenderLastMonth").addEventListener("click", (_e) => {
    calenderController.setCalenderLastMonth();
    onUpdateCalender();
});
document.getElementById("setCalenderNextMonth").addEventListener("click", (_e) => {
    calenderController.setCalenderNextMonth();
    onUpdateCalender();
});

document.getElementById("showSettingsButton").addEventListener("click", (_e) => {
    popupController.showSettingsPopup();
});

onUpdateCalender();
