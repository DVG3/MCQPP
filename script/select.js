

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
