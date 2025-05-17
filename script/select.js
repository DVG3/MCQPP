
/*
const ul = document.getElementById("test-list");
tests.forEach(path => {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.href = `test.html?file=AllTests/${path}`;
  a.className = "block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600";
  a.textContent = path;
  li.appendChild(a);
  ul.appendChild(li);
});
*/
// 🔹 GOOGLE DRIVE PUBLIC API (Dùng Google Apps Script)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxqQQIrN_v8GhiQ2pMxBVX-S2wWXdSXEo6G4_ohChBhVOfOZoyDEv3Q3FhH3jJf-7pQ/exec"; // <- Thay link Apps Script ở đây

document.addEventListener("DOMContentLoaded", () => {
  const testListDiv = document.getElementById("test-list");

  fetch(`${SCRIPT_URL}?mode=list`)
    .then(res => res.json())
    .then(files => {
      if (!Array.isArray(files)) {
        testListDiv.innerText = "Không lấy được danh sách đề.";
        return;
      }

      // Gom nhóm theo folder
      const folderMap = {};
      files.forEach(file => {
        const parts = file.path.split("/");
        const folderName = parts.slice(0, -1).join("/") || "Gốc";
        folderMap[folderName] = folderMap[folderName] || [];
        folderMap[folderName].push(file);
      });

      // Tạo UI accordion
      Object.entries(folderMap).forEach(([folder, fileList], index) => {
        const folderWrapper = document.createElement("div");

        const folderButton = document.createElement("button");
        folderButton.className = "w-full text-left bg-blue-200 hover:bg-blue-300 text-blue-900 font-semibold py-2 px-4 rounded";
        folderButton.textContent = `📁 ${folder}`;
        folderButton.addEventListener("click", () => {
          fileListDiv.classList.toggle("hidden");
        });

        const fileListDiv = document.createElement("div");
        fileListDiv.className = "pl-4 mt-2 hidden space-y-2";

        fileList.forEach(file => {
          const btn = document.createElement("button");
          btn.textContent = file.path.split("/").pop();
          btn.className = "block w-full text-left bg-blue-100 hover:bg-blue-200 text-blue-800 py-2 px-3 rounded";
          btn.addEventListener("click", () => loadTestById(file.id));
          fileListDiv.appendChild(btn);
        });

        folderWrapper.appendChild(folderButton);
        folderWrapper.appendChild(fileListDiv);
        testListDiv.appendChild(folderWrapper);
      });
    })
    .catch(err => {
      console.error("Lỗi tải danh sách đề:", err);
      testListDiv.innerText = "Lỗi kết nối.";
    });
});

function loadTestById(id) {
  fetch(`${SCRIPT_URL}?mode=get&id=${id}`)
    .then(res => res.json())
    .then(data => {
      localStorage.setItem("testData", JSON.stringify(data));
      window.location.href = "test.html";
    })
    .catch(err => {
      alert("Không thể tải đề thi: " + err.message);
    });
}

document.getElementById('fileInput').addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data.AllQuestions)) {
        alert("File không đúng định dạng đề thi.");
        return;
      }

      // Lưu đề tạm thời vào localStorage
      localStorage.setItem("uploadedTest", JSON.stringify(data));
      localStorage.setItem("isUploadedTest", "true");

      // Chuyển sang trang làm bài
      window.location.href = "test.html";
    } catch (err) {
      alert("File JSON bị lỗi hoặc không hợp lệ.");
    }
  };
  reader.readAsText(file);
});
