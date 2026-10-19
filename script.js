/* ====== CONFIG (edit fares, van number, discount here) ====== */
const VAN_NO = "JSC 715";
const DISCOUNT = 0.20;                       // 20% for Student / PWD / Senior Citizen
const DESTINATIONS = [
  { name: "Ormoc City, Leyte",           ticket: "Ormoc City",            fare: 119 },
  { name: "Merida, Leyte",               ticket: "Merida",                fare: 85  },
  { name: "Brgy. Apale, Isabel, Leyte",  ticket: "Brgy. Apale, Isabel",   fare: 65  },
  { name: "Brgy. Marvel, Isabel, Leyte", ticket: "Brgy. Marvel, Isabel",  fare: 55  },
];
const CATEGORIES = [["Regular", false], ["Student", true], ["Senior Citizen", true], ["PWD", true]];
const SEAT_COLS = [[15,16,17,18],[11,12,13,14],[7,8,9,10],[3,4,5,6],["D",null,1,2]]; // left -> right (D = driver)
const MONEY = [["₱1",1,1],["₱5",5,1],["₱10",10,1],["₱20",20,0],["₱50",50,0],["₱100",100,0],["₱200",200,0],["₱500",500,0],["₱1000",1000,0]]; // [label,value,isCoin]

/* ====== STATE ====== */
const $ = id => document.getElementById(id);
const S = { dest: null, cat: "Regular", id: "", seat: null, pick: null, paid: 0 };
let taken = [1, 2, 3, 7, 10];
try { taken = JSON.parse(localStorage.getItem("taken_seats")) || taken; } catch (e) {}
const saveTaken = () => { try { localStorage.setItem("taken_seats", JSON.stringify(taken)); } catch (e) {} };

const peso = n => "₱" + Number(n).toFixed(2);
const isDisc = () => CATEGORIES.find(c => c[0] === S.cat)[1];
const fare = () => !S.dest ? 0 : Math.round(S.dest.fare * (isDisc() ? 1 - DISCOUNT : 1));

/* ====== CLOCK ====== */
function now() {
  const d = new Date(), p = n => String(n).padStart(2, "0");
  let h = d.getHours(), ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12;
  return { date: `${p(d.getMonth() + 1)}/${p(d.getDate())}/${String(d.getFullYear()).slice(2)}`, time: `${h}:${p(d.getMinutes())} ${ap}` };
}
function tick() { const t = now(); $("clkTime").textContent = t.time; $("clkDate").textContent = t.date; }
setInterval(tick, 10000); tick();

/* ====== NAVIGATION ====== */
function go(n) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("on"));
  $("s" + n).classList.add("on");
  document.querySelectorAll(".steps li").forEach(li => li.classList.toggle("on", +li.dataset.s === n));
  window.scrollTo(0, 0);
}

/* ====== SCREEN 1 ====== */
const list = $("ddList");
DESTINATIONS.forEach(d => {
  const li = document.createElement("li");
  li.innerHTML = `<span>${d.name}</span><small>from ₱${d.fare}</small>`;
  li.onclick = () => { S.dest = d; $("ddBtn").firstChild.textContent = d.name.toUpperCase() + " "; list.hidden = true; refresh1(); };
  list.appendChild(li);
});
$("ddBtn").onclick = () => list.hidden = !list.hidden;
document.addEventListener("click", e => { if (!$("dd").contains(e.target)) list.hidden = true; });

CATEGORIES.forEach(([name, disc]) => {
  const b = document.createElement("button");
  b.className = "cat" + (name === "Regular" ? " on" : ""); b.dataset.c = name;
  b.innerHTML = name.toUpperCase() + `<small>${disc ? DISCOUNT * 100 + "% discount" : "No discount"}</small>`;
  b.onclick = () => {
    S.cat = name; if (!disc) S.id = "";
    document.querySelectorAll(".cat").forEach(x => x.classList.toggle("on", x === b));
    refresh1();
  };
  $("cats").appendChild(b);
});

["1","2","3","4","5","6","7","8","9","-","0","⌫"].forEach(k => {
  const b = document.createElement("button"); b.textContent = k; if (k === "-" || k === "⌫") b.className = "fn";
  b.onclick = () => { if (!isDisc()) return; S.id = k === "⌫" ? S.id.slice(0, -1) : (S.id.length < 15 ? S.id + k : S.id); refresh1(); };
  $("keypad").appendChild(b);
});

function refresh1() {
  const disc = isDisc(), inp = $("idInput");
  inp.disabled = !disc; inp.value = S.id;
  inp.placeholder = disc ? "Use keypad (e.g. 23-1-00055)" : "Not required for Regular";
  document.querySelectorAll("#keypad button").forEach(b => b.disabled = !disc);
  $("fareHint").textContent = S.dest ? `Fare: ${peso(fare())}` + (disc ? ` (${DISCOUNT * 100}% off)` : "") : "";
  $("toSeat").disabled = !(S.dest && (!disc || S.id.replace(/\D/g, "").length >= 4));
}
$("toSeat").onclick = () => { S.seat = null; S.pick = null; drawSeats(); refresh2(); go(2); };

/* ====== SCREEN 2 ====== */
$("vanNo").textContent = VAN_NO;
function drawSeats() {
  const map = $("seatMap"); map.innerHTML = "";
  SEAT_COLS.forEach(col => {
    const c = document.createElement("div"); c.className = "c";
    col.forEach(n => {
      const el = document.createElement(n === "D" ? "div" : n === null ? "div" : "button");
      if (n === "D") { el.className = "drv"; el.textContent = "Driver"; }
      else if (n === null) el.className = "gap";
      else {
        el.className = "seat" + (taken.includes(n) ? " taken" : "") + (S.pick === n ? " sel" : "");
        el.textContent = n; el.disabled = taken.includes(n);
        el.onclick = () => { S.pick = n; S.seat = null; drawSeats(); refresh2(); };
      }
      c.appendChild(el);
    });
    map.appendChild(c);
  });
}
function ticketHTML(withPay) {
  const t = now(), paid = S.paid, f = fare();
  return `<div class="ticket">
    <div class="r"><span>${t.date}</span><span>${t.time}</span></div>
    <div class="van">VAN/MINIBUS #: ${VAN_NO}</div>
    <div class="seatbox">Seat #:<b>${S.seat ?? "–"}</b></div>
    <p>Destination: ${S.dest.ticket}</p><p>Category: ${S.cat}</p>
    ${isDisc() ? `<p>ID#: ${S.id}</p>` : ""}
    <p>Fare: ${peso(f)}</p>
    <p>Payment: ${withPay ? peso(paid) : ""}</p>
    <p>Change: ${withPay ? peso(Math.max(0, paid - f)) : ""}</p></div>`;
}
function refresh2() {
  $("seatOut").textContent = S.pick ?? "–";
  $("seatOk").disabled = !S.pick || S.seat === S.pick;
  $("confirm").disabled = !S.seat;
  const keep = S.seat; if (!S.seat && S.pick) S.seat = null;
  $("prevTicket").innerHTML = ticketHTML(false).replace(/<b>.*?<\/b>/, `<b>${S.seat ?? S.pick ?? "–"}</b>`);
}
$("seatOk").onclick = () => { S.seat = S.pick; refresh2(); };
$("back2").onclick = () => go(1);
$("confirm").onclick = () => { S.paid = 0; refresh3(); go(3); };

/* ====== SCREEN 3 : payment ====== */
MONEY.forEach(([label, val, coin]) => {
  const b = document.createElement("button"); b.textContent = label; if (coin) b.className = "coin";
  b.onclick = () => insertMoney(val); $("sim").appendChild(b);
});
/* Hook for the real bill/coin acceptor: call insertMoney(amountInPesos)
   from your serial / Arduino / ESP32 reader each time money is detected. */
window.insertMoney = amt => { if ($("s3").classList.contains("on")) { S.paid += amt; refresh3(); } };

function refresh3() {
  const f = fare(), paid = S.paid, ok = paid >= f;
  $("payAmt").textContent = paid; $("fareAmt").textContent = f; $("chgAmt").textContent = ok ? paid - f : 0;
  $("getTicket").disabled = !ok;
  const m = $("payMsg");
  m.className = "msg " + (ok ? "ok" : paid ? "bad" : "");
  m.textContent = ok ? "Payment complete — press Get Ticket" : paid ? `Insufficient. Add ${peso(f - paid)} more` : "Please insert bills / coins";
  $("payTicket").innerHTML = ticketHTML(true);
}
$("cancel").onclick = reset;
$("getTicket").onclick = () => {
  if (S.paid < fare()) return;
  $("printTicket").innerHTML = ticketHTML(true);
  window.print();                          // thermal printer (58mm) via browser print
  taken.push(S.seat); saveTaken();
  $("done").hidden = false;
  setTimeout(() => { $("done").hidden = true; reset(); }, 2500);
};
function reset() {
  Object.assign(S, { dest: null, cat: "Regular", id: "", seat: null, pick: null, paid: 0 });
  $("ddBtn").firstChild.textContent = "SELECT DESTINATION ";
  document.querySelectorAll(".cat").forEach(x => x.classList.toggle("on", x.dataset.c === "Regular"));
  refresh1(); go(1);
}
refresh1();
