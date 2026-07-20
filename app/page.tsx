"use client";

import { useEffect, useMemo, useState } from "react";
import "./quiz.css";

type Article = { id: string; number: number; reference: string; text: string };
type Module = { id: string; title: string; range: string; articles: Article[] };
type Law = { law: string; lawNumber: string; source: string; sourcePages: number; modules: Module[] };
type Review = { reference: string; dueAt: string; stage: number };
type Subject = { id: string; name: string; goal: string };
type ImportedSource = { id: string; subjectId: string; name: string; kind: string; addedAt: string };

const sources = [
  { id: "code", label: "Codigo de Obras", file: "/data/code-231.json" },
  { id: "plan", label: "Revisao do Plano Diretor", file: "/data/plan-285.json" },
];

const questions = [
  { ref: "LC 231/2023, art. 14", prompt: "Qual ato administrativo nao e exigido para obras de demolicao?", options: ["Consulta de viabilidade", "Alvara de licenca de demolicao", "Projeto aprovado", "Vistoria e habite-se"], correct: 1, explanation: "Para demolicao, o art. 14 dispensa consulta de viabilidade, aprovacao de projeto, alvara de licenca de construcao e vistoria/habite-se. A licenca de demolicao continua necessaria." },
  { ref: "LC 231/2023, art. 21", prompt: "O Alvara de Projeto Aprovado e valido por qual prazo?", options: ["6 meses", "12 meses", "18 meses", "24 meses"], correct: 1, explanation: "O prazo e de 12 meses. Sem o pedido de Alvara de Licenca de Construcao nesse periodo, o projeto perde valor e passa por nova analise." },
  { ref: "LC 231/2023, art. 38", prompt: "Uma edificacao pode ser ocupada antes do habite-se?", options: ["Sim, se a obra estiver concluida", "Sim, com responsabilidade tecnica", "Nao, exige vistoria e habite-se", "Somente parcialmente"], correct: 2, explanation: "O art. 38 e direto: nenhuma edificacao pode ser ocupada sem vistoria municipal e expedicao do habite-se." },
  { ref: "LC 231/2023, art. 55", prompt: "Qual e o prazo maximo para atendimento de uma notificacao?", options: ["15 dias, sem prorrogacao", "30 dias, prorrogavel por igual periodo", "30 dias uteis", "60 dias"], correct: 1, explanation: "O prazo maximo e de 30 dias, com possibilidade de prorrogacao por igual periodo a pedido do interessado." },
  { ref: "LC 231/2023, art. 70", prompt: "Qual e o valor inicial da multa para infracao grave?", options: ["10 UFM", "50 UFM", "100 UFM", "150 UFM"], correct: 1, explanation: "Infracao grave: 50 UFM como valor inicial, acrescido de 10 UFM para cada infracao prevista." },
  { ref: "LC 231/2023, art. 77", prompt: "Obra executada sem a devida licenca pode sofrer embargo?", options: ["Nao, somente multa", "Sim", "Somente apos 90 dias", "Somente com decisao judicial"], correct: 1, explanation: "Sim. Obra sem a devida licenca e uma das hipoteses expressas de embargo." },
];

export default function Home() {
  const [active, setActive] = useState("Biblioteca");
  const [sourceId, setSourceId] = useState("code");
  const [law, setLaw] = useState<Law | null>(null);
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [articleId, setArticleId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [simulationStarted, setSimulationStarted] = useState(false);
  const [simulationSubmitted, setSimulationSubmitted] = useState(false);
  const [simulationAnswers, setSimulationAnswers] = useState<(number | null)[]>([]);
  const [simulationSeconds, setSimulationSeconds] = useState(0);
  const [subjects, setSubjects] = useState<Subject[]>([{ id: "fiscal", name: "Fiscal de Obras", goal: "Concurso publico" }]);
  const [subjectId, setSubjectId] = useState("fiscal");
  const [newSubject, setNewSubject] = useState("");
  const [importedSources, setImportedSources] = useState<ImportedSource[]>([]);

  useEffect(() => {
    const saved = window.localStorage.getItem("academia-fiscal-reviews");
    if (!saved) return;
    try { setReviews(JSON.parse(saved)); } catch { window.localStorage.removeItem("academia-fiscal-reviews"); }
  }, []);
  useEffect(() => { window.localStorage.setItem("academia-fiscal-reviews", JSON.stringify(reviews)); }, [reviews]);
  useEffect(() => {
    const saved = window.localStorage.getItem("academia-subjects");
    if (!saved) return;
    try { setSubjects(JSON.parse(saved)); } catch { window.localStorage.removeItem("academia-subjects"); }
  }, []);
  useEffect(() => { window.localStorage.setItem("academia-subjects", JSON.stringify(subjects)); }, [subjects]);
  useEffect(() => {
    const saved = window.localStorage.getItem("academia-imported-sources");
    if (!saved) return;
    try { setImportedSources(JSON.parse(saved)); } catch { window.localStorage.removeItem("academia-imported-sources"); }
  }, []);
  useEffect(() => { window.localStorage.setItem("academia-imported-sources", JSON.stringify(importedSources)); }, [importedSources]);
  useEffect(() => {
    if (!simulationStarted || simulationSubmitted) return;
    const timer = window.setInterval(() => setSimulationSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [simulationStarted, simulationSubmitted]);
  useEffect(() => {
    const selected = sources.find((source) => source.id === sourceId)!;
    setLoading(true); setModuleId(null); setArticleId(null); setQuery("");
    fetch(selected.file).then((response) => response.json()).then((data: Law) => {
      setLaw(data); setModuleId(data.modules[0]?.id ?? null); setArticleId(data.modules[0]?.articles[0]?.id ?? null);
    }).finally(() => setLoading(false));
  }, [sourceId]);

  const articles = useMemo(() => law?.modules.flatMap((module) => module.articles) ?? [], [law]);
  const selectedModule = law?.modules.find((module) => module.id === moduleId) ?? law?.modules[0];
  const selectedArticle = articles.find((article) => article.id === articleId) ?? selectedModule?.articles[0];
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return selectedModule?.articles ?? [];
    return articles.filter((article) => `${article.number} ${article.text}`.toLowerCase().includes(needle)).slice(0, 60);
  }, [articles, query, selectedModule]);
  const dueReviews = reviews.filter((review) => new Date(review.dueAt).getTime() <= Date.now());
  const question = questions[questionIndex];

  function chooseArticle(article: Article) {
    setArticleId(article.id);
    const owner = law?.modules.find((module) => module.articles.some((item) => item.id === article.id));
    if (owner) setModuleId(owner.id);
  }
  function answer(option: number) {
    if (chosen !== null) return;
    setChosen(option);
    if (option === question.correct) { setCorrectCount((value) => value + 1); return; }
    setReviews((items) => items.some((item) => item.reference === question.ref) ? items : [...items, { reference: question.ref, dueAt: new Date(Date.now() + 86400000).toISOString(), stage: 0 }]);
  }
  function nextQuestion() { setQuestionIndex((index) => (index + 1) % questions.length); setChosen(null); }
  function reviewError(reference: string, remembered: boolean) {
    setReviews((items) => items.map((item) => {
      if (item.reference !== reference) return item;
      if (!remembered) return { ...item, dueAt: new Date(Date.now() + 86400000).toISOString(), stage: 0 };
      const nextStage = item.stage + 1;
      const interval = [1, 3, 7, 15, 30][nextStage] ?? 365;
      return { ...item, stage: nextStage, dueAt: new Date(Date.now() + interval * 86400000).toISOString() };
    }).filter((item) => item.stage < 5));
  }
  function startSimulation() {
    setSimulationAnswers(Array(questions.length).fill(null));
    setSimulationSeconds(0); setSimulationSubmitted(false); setSimulationStarted(true);
  }
  function submitSimulation() {
    setSimulationSubmitted(true);
    setReviews((items) => {
      const newReviews = questions.filter((item, index) => simulationAnswers[index] !== item.correct && !items.some((review) => review.reference === item.ref)).map((item) => ({ reference: item.ref, dueAt: new Date(Date.now() + 86400000).toISOString(), stage: 0 }));
      return [...items, ...newReviews];
    });
  }
  function createSubject() {
    const name = newSubject.trim();
    if (!name) return;
    const subject = { id: `${Date.now()}`, name, goal: "Materia pessoal" };
    setSubjects((items) => [...items, subject]); setSubjectId(subject.id); setNewSubject("");
  }
  function addSource(file: File | null) {
    if (!file) return;
    setImportedSources((items) => [...items, { id: `${Date.now()}`, subjectId, name: file.name, kind: file.type || "arquivo", addedAt: new Date().toISOString() }]);
  }
  const formatDue = (dueAt: string) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(dueAt));
  const showReviews = active === "Hoje" || active === "Revisoes" || active === "Caderno de erros";
  const simulationScore = questions.filter((item, index) => simulationAnswers[index] === item.correct).length;
  const simulationTime = `${String(Math.floor(simulationSeconds / 60)).padStart(2, "0")}:${String(simulationSeconds % 60).padStart(2, "0")}`;

  if (active === "Materias") return <main>
    <aside className="rail"><div className="brand"><span className="brand-mark">AF</span><span>Academia<br/><em>Fiscal</em></span></div><p className="edition">SEU ACERVO DE ESTUDOS</p><nav>{["Hoje", "Biblioteca", "Questoes", "Revisoes", "Simulados", "Materias", "Caderno de erros"].map((item) => <button key={item} className={active === item ? "nav-active" : ""} onClick={() => setActive(item)}>{item}</button>)}</nav><div className="rail-bottom"><span className="signal"/> MATERIAS SEPARADAS<br/><small>Fase 3.1</small></div></aside>
    <section className="content"><header className="topline"><span>ACADEMIA DE ESTUDOS / ACERVO</span><span>{subjects.length} MATERIAS</span></header><section className="quiz-view"><p className="eyebrow">MATERIAS E FONTES</p><h1>Seu material.<br/><em>Seu caminho de estudo.</em></h1><div className="subject-create"><label htmlFor="new-subject">Nova materia ou objetivo</label><div><input id="new-subject" value={newSubject} onChange={(event) => setNewSubject(event.target.value)} onKeyDown={(event) => event.key === "Enter" && createSubject()} placeholder="Ex.: Calculo I, ingles, OAB"/><button className="study-button" onClick={createSubject}>ADICIONAR</button></div></div><div className="subject-list">{subjects.map((subject) => <button key={subject.id} className={subject.id === subjectId ? "subject-current" : ""} onClick={() => setSubjectId(subject.id)}><b>{subject.name}</b><span>{subject.goal}{subject.id === "fiscal" ? " · biblioteca pronta" : " · nova trilha"}</span></button>)}</div><section className="source-import"><p className="eyebrow">IMPORTAR PARA {subjects.find((subject) => subject.id === subjectId)?.name?.toUpperCase()}</p><h2>Adicione uma fonte de estudo</h2><p>PDFs, apostilas, slides e listas serão organizados antes de qualquer geração por IA.</p><label className="file-button" htmlFor="source-file">ESCOLHER ARQUIVO</label><input id="source-file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" onChange={(event) => addSource(event.target.files?.[0] ?? null)}/><div className="imported-sources">{importedSources.filter((source) => source.subjectId === subjectId).length ? importedSources.filter((source) => source.subjectId === subjectId).map((source) => <article key={source.id}><b>{source.name}</b><span>Fonte registrada · aguardando extracao</span></article>) : <span>Nenhuma fonte adicional nesta materia.</span>}</div></section></section></section>
  </main>;

  if (active === "Materias") return <main><aside className="rail"><div className="brand"><span className="brand-mark">AF</span><span>Academia<br/><em>Fiscal</em></span></div><p className="edition">SEU ACERVO DE ESTUDOS</p><nav>{["Hoje", "Biblioteca", "Questoes", "Revisoes", "Simulados", "Materias", "Caderno de erros"].map((item) => <button key={item} className={active === item ? "nav-active" : ""} onClick={() => setActive(item)}>{item}</button>)}</nav><div className="rail-bottom"><span className="signal"/> MATERIAS SEPARADAS<br/><small>Fase 3.1</small></div></aside><section className="content"><header className="topline"><span>ACADEMIA DE ESTUDOS / MATERIAS</span><span>{subjects.length} CADASTRADAS</span></header><section className="quiz-view"><p className="eyebrow">SEU ESPACO DE ESTUDO</p><h1>Uma plataforma.<br/><em>Qualquer materia.</em></h1><div className="subject-create"><label htmlFor="new-subject">Nova materia ou objetivo</label><div><input id="new-subject" value={newSubject} onChange={(event) => setNewSubject(event.target.value)} onKeyDown={(event) => event.key === "Enter" && createSubject()} placeholder="Ex.: Calculo I, ingles, OAB"/><button className="study-button" onClick={createSubject}>ADICIONAR</button></div></div><div className="subject-list">{subjects.map((subject) => <button key={subject.id} className={subject.id === subjectId ? "subject-current" : ""} onClick={() => { setSubjectId(subject.id); setActive("Biblioteca"); }}><b>{subject.name}</b><span>{subject.goal}{subject.id === "fiscal" ? " · biblioteca pronta" : " · pronta para receber fontes"}</span></button>)}</div></section></section></main>;

  if (active === "Simulados") return <main>
    <aside className="rail"><div className="brand"><span className="brand-mark">AF</span><span>Academia<br/><em>Fiscal</em></span></div><p className="edition">BAL. PICARRAS - CADERNO 01</p><nav>{["Hoje", "Biblioteca", "Questoes", "Revisoes", "Simulados", "Materias", "Caderno de erros"].map((item) => <button key={item} className={active === item ? "nav-active" : ""} onClick={() => setActive(item)}>{item}</button>)}</nav><div className="rail-bottom"><span className="signal"/> FONTES RASTREAVEIS<br/><small>Fase 1.3</small></div></aside>
    <section className="content"><header className="topline"><span>FISCAL DE OBRAS / SIMULADO</span><span>{simulationStarted ? simulationTime : "06 QUESTOES"}</span></header><section className="quiz-view"><p className="eyebrow">SIMULADO 01 - CODIGO DE OBRAS</p><h1>Teste sua leitura.<br/><em>Meça sua evolucao.</em></h1>{!simulationStarted ? <div className="simulation-intro"><p>6 questoes objetivas, baseadas nos arts. 14, 21, 38, 55, 70 e 77 da LC 231/2023.</p><p>Ao finalizar, cada erro entra automaticamente na sua agenda de revisoes.</p><button className="study-button" onClick={startSimulation}>INICIAR SIMULADO -&gt;</button></div> : <><div className="quiz-stats"><span>{simulationAnswers.filter((answer) => answer !== null).length} / {questions.length} respondidas</span><span>{simulationTime}</span><span>{simulationSubmitted ? `${simulationScore} acertos` : "em andamento"}</span></div>{simulationSubmitted && <div className="simulation-result"><b>Resultado: {simulationScore} de {questions.length}</b><span>{simulationScore === questions.length ? "Excelente. Nenhum novo erro para revisar." : `${questions.length - simulationScore} itens foram adicionados a sua agenda.`}</span></div>}<div className="simulation-questions">{questions.map((item, questionPosition) => <article className="simulation-question" key={item.ref}><p className="eyebrow">{String(questionPosition + 1).padStart(2, "0")} · {item.ref}</p><h2>{item.prompt}</h2><div className="answers">{item.options.map((option, optionIndex) => <button key={option} disabled={simulationSubmitted} className={simulationSubmitted ? optionIndex === item.correct ? "answer-correct" : simulationAnswers[questionPosition] === optionIndex ? "answer-wrong" : "" : simulationAnswers[questionPosition] === optionIndex ? "answer-selected" : ""} onClick={() => setSimulationAnswers((answers) => answers.map((answer, index) => index === questionPosition ? optionIndex : answer))}>{String.fromCharCode(65 + optionIndex)}. {option}</button>)}</div>{simulationSubmitted && <p className="simulation-explanation">{item.explanation}</p>}</article>)}</div>{!simulationSubmitted ? <button className="study-button" onClick={submitSimulation}>FINALIZAR E CORRIGIR -&gt;</button> : <button className="study-button" onClick={startSimulation}>REFACER SIMULADO -&gt;</button>}</>}</section></section>
  </main>;

  return <main>
    <aside className="rail"><div className="brand"><span className="brand-mark">AF</span><span>Academia<br/><em>Fiscal</em></span></div><p className="edition">BAL. PICARRAS - CADERNO 01</p><nav>{["Hoje", "Biblioteca", "Questoes", "Revisoes", "Simulados", "Materias", "Caderno de erros"].map((item) => <button key={item} className={active === item ? "nav-active" : ""} onClick={() => setActive(item)}>{item}</button>)}</nav><div className="rail-bottom"><span className="signal"/> FONTES RASTREAVEIS<br/><small>Fase 1.2</small></div></aside>
    <section className="content"><header className="topline"><span>FISCAL DE OBRAS / BIBLIOTECA LEGAL</span><span>{law?.lawNumber ?? "CARREGANDO"}</span></header>
      {showReviews ? <section className="quiz-view"><p className="eyebrow">{active === "Hoje" ? "SEU PLANO DE HOJE" : "REVISAO ESPACADA"}</p><h1>{active === "Hoje" ? <>O que merece<br/><em>sua atencao agora.</em></> : <>Caderno de erros.<br/><em>Memoria em construcao.</em></>}</h1><div className="quiz-stats"><span>{dueReviews.length} para hoje</span><span>{reviews.length} na agenda</span><span>{correctCount} acertos nesta sessao</span></div>{dueReviews.length ? <div className="review-list"><b>Revisar agora</b>{dueReviews.map((review) => <article key={review.reference}><span>{review.reference}</span><small>etapa {review.stage + 1} de 5</small><div><button onClick={() => reviewError(review.reference, false)}>AINDA NAO</button><button className="study-button" onClick={() => reviewError(review.reference, true)}>LEMBREI</button></div></article>)}</div> : reviews.length ? <div className="error-note"><b>Agenda em dia</b>{reviews.map((review) => <span key={review.reference}>{review.reference} · proxima revisao {formatDue(review.dueAt)}</span>)}</div> : <p className="loading">Nenhuma revisao criada. Erre uma questao para iniciar sua agenda.</p>}</section> : active === "Questoes" ? <section className="quiz-view"><p className="eyebrow">FASE 2 - QUESTOES POR ARTIGO</p><h1>Recupere a regra.<br/><em>Depois confira a fonte.</em></h1><div className="quiz-stats"><span>{questionIndex + 1} / {questions.length}</span><span>{correctCount} acertos</span><span>{reviews.length} na agenda</span></div><article className="question-card"><p className="eyebrow">{question.ref}</p><h2>{question.prompt}</h2><div className="answers">{question.options.map((option, index) => <button key={option} className={chosen === null ? "" : index === question.correct ? "answer-correct" : index === chosen ? "answer-wrong" : ""} onClick={() => answer(index)}>{String.fromCharCode(65 + index)}. {option}</button>)}</div>{chosen !== null && <div className="feedback"><b>{chosen === question.correct ? "Correto." : "Para revisar."}</b><p>{question.explanation}</p>{chosen !== question.correct && <p><b>Agenda criada:</b> 1, 3, 7, 15 e 30 dias.</p>}<button className="study-button" onClick={nextQuestion}>PROXIMA QUESTAO -&gt;</button></div>}</article></section> : <><section className="library-header"><p className="eyebrow">FASE 1.1 - INDICE CONFIAVEL</p><h1>Leia a fonte.<br/><em>Encontre a regra.</em></h1><p>Todo item desta biblioteca aponta para uma norma e artigo de origem.</p></section><div className="law-tabs" role="tablist">{sources.map((source) => <button key={source.id} role="tab" aria-selected={sourceId === source.id} onClick={() => setSourceId(source.id)}>{source.label}</button>)}</div>{loading || !law ? <p className="loading">Organizando a fonte legal...</p> : <section className="library-layout"><aside className="outline"><p className="outline-label">{law.lawNumber}</p><h2>{law.law}</h2><p className="source-meta">{law.sourcePages} paginas<br/>{law.source}</p><div className="module-nav">{law.modules.map((module) => <button key={module.id} className={module.id === selectedModule?.id ? "selected-module" : ""} onClick={() => { setModuleId(module.id); setArticleId(module.articles[0]?.id ?? null); setQuery(""); }}><span>{module.range}</span>{module.title}<small>{module.articles.length} artigos</small></button>)}</div></aside><section className="article-list"><label htmlFor="search">Buscar artigo ou termo</label><input id="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex.: embargo, 70, habite-se"/><p className="result-count">{query ? `${results.length} resultados` : selectedModule?.range}</p><div>{results.map((article) => <button className={article.id === selectedArticle?.id ? "article-row current" : "article-row"} key={article.id} onClick={() => chooseArticle(article)}><strong>Art. {article.number}</strong><span>{article.text.replace(/^Art\. \d+ -\s*/, "").slice(0, 115)}...</span></button>)}</div></section><article className="reader" aria-live="polite">{selectedArticle ? <><p className="eyebrow">{selectedArticle.reference}</p><h2>Art. {selectedArticle.number}</h2><p className="article-text">{selectedArticle.text}</p><div className="reader-note"><b>Fonte</b><span>{law.source} - {law.lawNumber}</span></div></> : <p>Selecione um artigo.</p>}</article></section>}</>}
    </section>
  </main>;
}
