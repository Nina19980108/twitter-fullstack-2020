const socket = io()     // 建立 socket 通道
const socketForm = document.getElementById('socketForm')  // layouts/main.hbs 的 textarea id
const socketMsg = document.getElementById('socketMsg')    // layouts/main.hbs 的 Form id
let messages = document.getElementById('messages');
const onlineUsers = []  // 儲存上線使用者人數之陣列
const onlineList = document.getElementById('onlineList')
// 當前上線人數
function displayOnlineList(onlineUsersData) {
  let onlineListHTML = ''
  onlineUsersData.forEach(function (user) {
    onlineListHTML += `
    <div>
      <a href="/users/${user.id}/tweets">
      <img src="${user.avatar}"
        style="border-radius: 0.7em;height: 21vh;width: 21vh;margin-left:0.4em;object-fit: cover;">
      </a>
      <div style="color:#313c4b;width:9vw" class="d-flex align-items-center justify-content-center p-2">
       <div class="d-flex flex-column m-1 ms-4" style="">
        <p class="m-0 fw-bolder">${user.name}</p>
        <p class="m-0" style="color: #313c4b6b;">${user.account}</p>
       </div>
      </div>
    </div>
  `
  })
  onlineList.innerHTML = onlineListHTML
}

socket.on('onlineCount', onlineCount => {
  console.log('Front get onlineCount', onlineCount)
  // DOM: 刷新頁面 上線人數
})

// 取得上線使用者清單
socket.on('onlineUsers', onlineUsersData => {
  onlineUsers.push(onlineUsersData)
  console.log('Online User List', onlineUsers)
  // DOM: 刷新頁面 上線使用者清單
  displayOnlineList(onlineUsersData)

})

// 廣播訊息: xxx 進入/離開 聊天室
socket.on('broadcast', data => {
  console.log('公告: ', data)
  // DOM: 留言區插入公告訊息
})

// 監聽發送留言
socketForm.addEventListener('submit', event => {
  // 停止 submit 動作
  event.preventDefault()
  // socketForm 帶出 登入使用者的 id, socketMsg 帶出 留言內容
  socket.emit('chat message', { id: socketForm.dataset.id, msg: socketMsg.value })
  // 清空 留言內容
  socketMsg.value = ''
  // 跳出 submit
  return false
})

// 添加顯示留言
socket.on('chat message', data => {
  console.log(socketForm.dataset.id)
  console.log('留言資訊', data)
  let item = document.createElement('div')
  if (Number(socketForm.dataset.id) === data.id) {
    // 屬於自己的留言
    // DOM: 留言右半 HTML
    console.log('我的')
    let htmlContent = `<div class="d-flex mb-3 flex-row-reverse">
        <a href="/users/${data.id}/tweets" style="">
          <img src="${data.avatar}"
            onerror="javascript:this.src='https://mir-s3-cdn-cf.behance.net/project_modules/1400_opt_1/37a04795636919.5ff053424df01.jpg';"
            style="border:1px solid;border-radius: 0.7em;height: 10vh;width: 10vh;object-fit: cover;">
        </a>
        <div style="color:#313c4b" class="ms-4">
          <div class="d-flex">
            <p class="fs-5 me-3 mb-0"><strong>${data.name}</strong></p>
            <p class="mb-0" style="color: #313c4b84;margin-top:0.1em;">@account</p>
            <p class="mb-0" style="color: #313c4b84;margin:0.42em 0 0 0.5em;font-size:smaller"> ・3秒前</p>
          </div>
          <p class="mt-1" style="font-size: small;">
            ${data.msg}
          </p>
        </div>
      </div>
    `
    item.innerHTML = htmlContent;
    messages.appendChild(item);
  } else {
    // 屬於別人的留言
    // DOM: 留言左半 HTML
    console.log('別人的')
    let htmlContent = `<div class="d-flex mb-3">
        <a href="/users/${data.id}/tweets" style="">
          <img src="${data.avatar}"
            onerror="javascript:this.src='https://mir-s3-cdn-cf.behance.net/project_modules/1400_opt_1/37a04795636919.5ff053424df01.jpg';"
            style="border:1px solid;border-radius: 0.7em;height: 10vh;width: 10vh;object-fit: cover;">
        </a>
        <div style="color:#313c4b" class="ms-4">
          <div class="d-flex">
            <p class="fs-5 me-3 mb-0"><strong>${data.name}</strong></p>
            <p class="mb-0" style="color: #313c4b84;margin-top:0.1em;">@account</p>
            <p class="mb-0" style="color: #313c4b84;margin:0.42em 0 0 0.5em;font-size:smaller"> ・3秒前</p>
          </div>
          <p class="mt-1" style="font-size: small;">
            ${data.msg}
          </p>
        </div>
      </div>
    `
    item.innerHTML = htmlContent;
    messages.appendChild(item);
  }
})