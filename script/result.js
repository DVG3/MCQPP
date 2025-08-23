const data = JSON.parse(localStorage.getItem("quizResult"));
document.getElementById("score").innerText = `Bạn đúng ${data.score}/${data.total} câu`;

const review = document.getElementById("results");
data.answers.forEach((q, index) => {
  const div = document.createElement("div");
  div.innerHTML = `<h2>Câu ${index + 1}: ${q.question}</h2>`;
  div.className = `p-5 my-5 rounded border `;//${isCorrect ?  : }`;

  q.choices.forEach((choice, i) => {
    let wro = false;
    const span = document.createElement("div");
    span.textContent = choice;
    span.className =`p-4 my-2 rounded border `;
    if (i === q.correctAnswer) span.style.background = "lightgreen";
    if (i === q.selected && i !== q.correctAnswer) 
      {
        span.style.background = "salmon";
        div.className += 'bg-red-100 border-red-400';
        wro = true;
      }
    if (!wro)
    {
        div.className += 'bg-green-100 border-green-400';

    }
    div.appendChild(span);
  });
  const exp = document.createElement("p");
  exp.innerText = "Giải thích: " + q.explanation;
  exp.className = "text-sm text-gray-600 mt-2";
  div.appendChild(exp);
  review.appendChild(div);
});

function renderResults() {
  const container = document.getElementById("results");
  const userAnswers = data.answers;
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
      <p class="text-sm text-gray-600 mt-2">📝 Giải thích: ${(q.Explanation||q.Explantion) || "Không có"}</p>
    `;

    container.appendChild(div);
  });

  // Hiển thị tổng kết
  document.getElementById("score").textContent = `🎯 Số câu đúng: ${correctCount}/${questions.length}`;
}
//renderResults()
