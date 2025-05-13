const data = JSON.parse(localStorage.getItem("quizResult"));
document.getElementById("score").innerText = `Bạn đúng ${data.score}/${data.total} câu`;

const review = document.getElementById("review");
data.userAnswers.forEach((q, index) => {
  const div = document.createElement("div");
  div.innerHTML = `<h3>Câu ${index + 1}: ${q.question}</h3>`;
  q.choices.forEach((choice, i) => {
    const span = document.createElement("div");
    span.textContent = choice;
    if (i === q.correctAnswer) span.style.background = "lightgreen";
    if (i === q.selected && i !== q.correctAnswer) span.style.background = "salmon";
    div.appendChild(span);
  });
  const exp = document.createElement("p");
  exp.innerText = "Giải thích: " + q.explanation;
  div.appendChild(exp);
  review.appendChild(div);
});
