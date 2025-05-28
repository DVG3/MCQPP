

let questions = [], current = 0, score = 0, userAnswers = [];
const qBox = document.getElementById('question-box');
const explanationDiv = document.getElementById('explanation');
const nextBtn = document.getElementById('next-btn');
let currentQuestionIndex = 0;
const params = new URLSearchParams(location.search);
const file = params.get("file");
fetch(file)
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array
}

function getQueryParam(param) {
  return new URLSearchParams(window.location.search).get(param);
}

//let questions = [];

// if (file) {
//   // Load từ file trên server
//   fetch(file)
//     .then(res => res.json())
//     .then(data => {
//       questions = shuffle([...data["AllQuestions"]]);
      
//       loadQuestion(currentQuestionIndex);
//     })
//     // .catch(err => {
//     //   alert("Không thể tải đề thi từ đường dẫn. Kiểm tra lại.");
//     // });
// } else 
if (localStorage.getItem("isUploadedTest") === "true") {
  // Load từ file người dùng chọn
  const datat = JSON.parse(localStorage.getItem("uploadedTest"));
  questions = shuffle([...datat["AllQuestions"]]);
  loadQuestion(currentQuestionIndex);
  localStorage.removeItem("isUploadedTest");
} else {
  const testData = JSON.parse(localStorage.getItem("testData"));
  questions = shuffle([...testData["AllQuestions"]]);
      
  loadQuestion(currentQuestionIndex);
}

//loadQuestion(currentQuestionIndex);



function loadQuestion(i) {
    const q = questions[i];
    qBox.innerHTML = `
    <h2 class="text-xl font-semibold mb-2">Câu ${i + 1}:</h2>
    <p class="text-lg mb-4">${q.Question}</p>
    `;
    
  q.Choices.forEach((choice, index) => {
    const btn = document.createElement('div');
    btn.textContent = choice;
    btn.className = `
      choice-box cursor-pointer p-4 mb-3 rounded border border-gray-300 
      hover:bg-blue-50 transition
    `;
    btn.onclick = () => handleAnswer(index, q);
    btn.dataset.index = index;
    qBox.appendChild(btn);
  });
}


function handleAnswer(selected, question) {
  const btns = document.querySelectorAll('.choice-box');
  btns.forEach((btn, i) => {
    btn.classList.remove('bg-blue-50');

    if (i === question.Ans) {
      btn.classList.add('bg-green-200', 'border-green-500');
    }
    if (i === selected && i !== question.Ans) {
      btn.classList.add('bg-red-200', 'border-red-500');
    }

    btn.classList.add('pointer-events-none'); // disable click
  });

  explanationDiv.innerHTML = `<strong>Giải thích:</strong> ${question.Explantion || question.Explanation}`;
  explanationDiv.classList.remove('hidden');

  userAnswers.push({
    question: question.Question,
    selected,
    correct: selected === question.Ans,
    correctAnswer: question.Ans,
    explanation: question.Explantion,
    choices: question.Choices
  });

  if (selected === question.Ans) score++;

  if (currentQuestionIndex < questions.length - 1) {
  nextBtn.textContent = "Tiếp theo";
  nextBtn.onclick = () => {
    currentQuestionIndex++;
    loadQuestion(currentQuestionIndex);
    nextBtn.classList.add("hidden");
    explanationDiv.classList.add("hidden");
  };
  nextBtn.classList.remove('hidden');
} else {
  nextBtn.textContent = "Hoàn thành";
  nextBtn.onclick = () => {
    localStorage.setItem("quizResult", JSON.stringify({
      score,
      total: questions.length,
      answers: userAnswers
    }));
    window.location.href = "result.html";
  };
  nextBtn.classList.remove('hidden');
}
}

nextBtn.onclick = () => {
  current++;
  if (current >= questions.length) {
    localStorage.setItem("quizResult", JSON.stringify({ score, total: questions.length, userAnswers }));
    location.href = "result.html";
  } else {
    nextBtn.style.display = "none";
    explanationDiv.style.display = "none";
    loadQuestion(current);
  }
};

fetch(getQueryParam("file"))
  .then(res => res.json())
  .then(data => {
    questions = data.AllQuestions;
    shuffle(questions);
    loadQuestion(current);
  });
