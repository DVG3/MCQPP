function renderResults() {
  const container = document.getElementById("results");
  const userAnswers = JSON.parse(localStorage.getItem("userAnswers") || "[]");
  const questions = JSON.parse(localStorage.getItem("questions") || "[]");

  let correctCount = 0;

  questions.forEach((q, i) => {
    const user = userAnswers[i];
    const isCorrect = user === q.Ans;
    if (isCorrect) correctCount++;

    const div = document.createElement("div");
    div.className = `p-4 my-2 rounded border ${isCorrect ? 'bg-green-100 border-green-400' : 'bg-red-100 border-red-400'}`;

    div.innerHTML = `
      <p class="font-semibold">Câu ${i + 1}: ${q.Question}</p>
      <ul class="mt-2">
        ${q.Choices.map((choice, idx) => `
          <li class="ml-4 ${idx === q.Ans ? 'text-green-600 font-bold' : ''} ${idx === user && idx !== q.Ans ? 'text-red-600 line-through' : ''}">
            ${String.fromCharCode(65 + idx)}. ${choice}
          </li>`).join("")}
      </ul>
      <p class="text-sm text-gray-600 mt-2">📝 Giải thích: ${q.Explantion || "Không có"}</p>
    `;

    container.appendChild(div);
  });

  // Hiển thị tổng kết
  document.getElementById("score").textContent = `🎯 Số câu đúng: ${correctCount}/${questions.length}`;
}