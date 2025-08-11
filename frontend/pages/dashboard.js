import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function callAuth(path, opts = {}) {
  const token = localStorage.getItem('token');
  return fetch(API + path, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    ...opts,
  });
}

const OPDS = ["OPD-1", "OPD-2", "OPD-3"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Dashboard() {
  // State: Tabs & data
  const [tab, setTab] = useState("queue");
  const [queue, setQueue] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Booking modal state
  const [showBooking, setShowBooking] = useState(false);
  const [bookingName, setBookingName] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingDoctor, setBookingDoctor] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");

  // Add Doctor modal state
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState("");
  const [newDoctorSpecialization, setNewDoctorSpecialization] = useState("");
  const [newDoctorGender, setNewDoctorGender] = useState("");
  const [newDoctorLocation, setNewDoctorLocation] = useState("");
  const [newDoctorAvailability, setNewDoctorAvailability] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/";
      return;
    }
    loadAll();
    const id = setInterval(loadAll, 6000);
    return () => clearInterval(id);
  }, []);

  async function loadAll() {
    setLoading(true);
    const [qRes, dRes, aRes] = await Promise.all([
      fetch(API + "/queue"),
      fetch(API + "/doctors"),
      fetch(API + "/appointments"),
    ]);
    setQueue(await qRes.json());
    setDoctors(await dRes.json());
    setAppointments(await aRes.json());
    setLoading(false);
  }

  // ========== QUEUE ==========
  async function addWalkin() {
    const name = prompt('Patient name:');
    if (!name) return;
    const phone = prompt('Phone (optional):');
    const res = await callAuth('/queue/walkin', { method: 'POST', body: JSON.stringify({ name, phone }) });
    if (res.ok) loadAll();
    else alert('Failed to add');
  }
  async function updateQueueStatus(id, status) {
    const res = await callAuth(`/queue/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    if (res.ok) loadAll();
    else alert('Failed');
  }
  async function assignDoctor(id) {
    const docId = parseInt(prompt('Enter doctor id to assign:'));
    if (!docId) return;
    const res = await callAuth(`/queue/${id}/assign-doctor`, { method: 'PATCH', body: JSON.stringify({ doctorId: docId }) });
    if (res.ok) loadAll();
    else alert('Failed to assign doctor');
  }

  // ========== APPOINTMENTS ==========
  async function changeApStatus(id) {
    const status = prompt('New status (booked/completed/canceled):');
    if (!status) return;
    const res = await callAuth(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    if (res.ok) loadAll();
    else alert('Failed');
  }
  async function submitBooking() {
    if (!bookingName || !bookingDoctor || !bookingDate || !bookingTime) {
      alert('Please fill all required fields.');
      return;
    }
    const walkRes = await callAuth('/queue/walkin', {
      method: 'POST',
      body: JSON.stringify({ name: bookingName, phone: bookingPhone }),
    });
    if (!walkRes.ok) { alert('Failed to create patient'); return; }
    const qi = await walkRes.json();
    const patientId = qi.patient.id;
    const datetime = new Date(`${bookingDate}T${bookingTime}`).toISOString();
    const apRes = await callAuth('/appointments', {
      method: 'POST',
      body: JSON.stringify({ doctorId: parseInt(bookingDoctor), patientId, datetime }),
    });
    if (apRes.ok) {
      alert('Appointment booked!');
      setShowBooking(false);
      setBookingName('');
      setBookingPhone('');
      setBookingDoctor('');
      setBookingDate('');
      setBookingTime('');
      loadAll();
    } else alert('Failed to book appointment');
  }

  // ========== ADD DOCTOR ==========
  function openAddDoctorModal() {
    setNewDoctorName("");
    setNewDoctorSpecialization("");
    setNewDoctorGender("");
    setNewDoctorLocation("");
    setNewDoctorAvailability([]);
    setShowAddDoctor(true);
  }
  function addAvailabilityEntry() {
    setNewDoctorAvailability([...newDoctorAvailability, { day: "", slots: [""] }]);
  }
  function updateAvailabilityDay(index, day) {
    const updated = [...newDoctorAvailability];
    updated[index].day = day;
    setNewDoctorAvailability(updated);
  }
  function updateAvailabilitySlot(index, slotIdx, value) {
    const updated = [...newDoctorAvailability];
    updated[index].slots[slotIdx] = value;
    setNewDoctorAvailability(updated);
  }
  function addSlotToAvailability(index) {
    const updated = [...newDoctorAvailability];
    updated[index].slots.push('');
    setNewDoctorAvailability(updated);
  }
  function removeAvailabilityEntry(index) {
    const updated = [...newDoctorAvailability];
    updated.splice(index, 1);
    setNewDoctorAvailability(updated);
  }
  function removeSlotFromAvailability(index, slotIdx) {
    const updated = [...newDoctorAvailability];
    updated[index].slots.splice(slotIdx, 1);
    setNewDoctorAvailability(updated);
  }
  async function submitNewDoctor() {
    if (!newDoctorName || !newDoctorSpecialization || !newDoctorGender || !newDoctorLocation) {
      alert('Please fill all required fields');
      return;
    }
    // Only save valid days w/ non-empty slot array
    const availabilityClean = newDoctorAvailability
      .filter(a => DAYS.includes(a.day) && a.slots.length && a.slots.every(s => s));
    const payload = {
      name: newDoctorName,
      specialization: newDoctorSpecialization,
      gender: newDoctorGender,
      location: newDoctorLocation,
      availability: availabilityClean,
    };
    const res = await callAuth('/doctors', { method: 'POST', body: JSON.stringify(payload) });
    if (res.ok) {
      alert('Doctor added!');
      setShowAddDoctor(false);
      loadAll();
    } else alert('Failed to add doctor');
  }

  function Logout() {
    localStorage.removeItem("token");
    window.location.href = "/";
  }

  // ========== RENDER ==========
  return (
    <div className="page">
      <header className="header">
        <div className="left">
          <img src="/logo.png" alt="logo" className="logo" />
          <div>
            <h2>Clinic Front Desk</h2>
            <div className="sub">Manage queue • Book appointments • Doctor profiles</div>
          </div>
        </div>
        <div className="right">
          <button className="ghost" onClick={() => setTab("queue")}>Queue</button>
          <button className="ghost" onClick={() => setTab("appointments")}>Appointments</button>
          <button className="ghost" onClick={() => setTab("doctors")}>Doctors</button>
          <button className="logout" onClick={Logout}>Log out</button>
        </div>
      </header>
      <main className="main">
        {loading && <div className="loading">Refreshing...</div>}
        {tab === "queue" && (
          <section>
            <div className="panelHeader">
              <h3>Queue Management</h3>
              <button className="primary" onClick={addWalkin}>Add Walk-in</button>
            </div>
            <div className="grid">
              {queue.map(q => (
                <div className="card" key={q.id}>
                  <div className="qnum">#{q.queueNumber}</div>
                  <div><strong>{q.patient.name}</strong></div>
                  <div className="muted">{q.patient.phone || '—'}</div>
                  <div className="status">
                    Status: <strong className={q.status.replace(" ", "")}>{q.status}</strong>
                  </div>
                  <div className="actions">
                    <button onClick={() => updateQueueStatus(q.id, "waiting")}>Waiting</button>
                    <button onClick={() => updateQueueStatus(q.id, "with_doctor")}>With Doctor</button>
                    <button onClick={() => updateQueueStatus(q.id, "completed")}>Completed</button>
                    <button onClick={() => assignDoctor(q.id)}>Assign Doctor</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        {tab === "appointments" && (
          <section>
            <div className="panelHeader">
              <h3>Appointments</h3>
              <button className="primary" onClick={() => setShowBooking(true)}>Book Appointment</button>
            </div>
            <div className="list">
              {appointments.map(a => (
                <div className="apCard" key={a.id}>
                  <div>
                    <div className="apDoctor">{a.doctor.name} • {a.doctor.specialization}</div>
                    <div className="apPatient">{a.patient.name} • {new Date(a.datetime).toLocaleString()}</div>
                  </div>
                  <div className="apRight">
                    <div className="apStatus">{a.status}</div>
                    <div className="apActions">
                      <button onClick={() => changeApStatus(a.id)}>Change Status</button>
                      <button onClick={async () => {
                        const dt = prompt('New datetime:', new Date(a.datetime).toISOString().slice(0,16));
                        if (!dt) return;
                        const res = await callAuth(`/appointments/${a.id}/reschedule`, { method: 'PATCH', body: JSON.stringify({ datetime: dt }) });
                        if (res.ok) loadAll();
                        else alert('fail');
                      }}>Reschedule</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        {tab === "doctors" && (
          <section>
            <div className="panelHeader">
              <h3>Doctors</h3>
              <button className="primary" onClick={openAddDoctorModal}>Add Doctor</button>
            </div>
            <div className="grid">
              {doctors.map(d => (
                <div className="card" key={d.id}>
                  <div className="docName">{d.name}</div>
                  <div className="muted">{d.specialization} • {d.location}</div>
                  <div className="muted">Gender: {d.gender}</div>
                  <div className="availability">
                    <strong>Availability:</strong>
                    {d.availability?.length ? d.availability.map((a, i) => (
                      <div key={i}>{a.day}: {a.slots.join(', ')}</div>
                    )) : <div className="muted">No schedule</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* BOOKING MODAL */}
      {showBooking && (
        <div className="modalBg" onClick={() => setShowBooking(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Book Appointment</h3>
            <label>Patient Name *</label>
            <input value={bookingName} onChange={e => setBookingName(e.target.value)} />
            <label>Phone</label>
            <input value={bookingPhone} onChange={e => setBookingPhone(e.target.value)} />
            <label>Doctor *</label>
            <select value={bookingDoctor} onChange={e => setBookingDoctor(e.target.value)}>
              <option value="">Select doctor</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name} - {d.specialization}</option>
              ))}
            </select>
            <label>Date *</label>
            <input type="date" value={bookingDate} min={new Date().toISOString().split('T')[0]} onChange={e => setBookingDate(e.target.value)} />
            <label>Time *</label>
            <input type="time" value={bookingTime} onChange={e => setBookingTime(e.target.value)} />
            <button className="primary" onClick={submitBooking}>Confirm</button>
            <button className="secondary" style={{marginTop:'8px'}} onClick={()=>setShowBooking(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ADD DOCTOR MODAL */}
      {showAddDoctor && (
        <div className="modalBg" onClick={() => setShowAddDoctor(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Add Doctor</h3>
            <label>Name *</label>
            <input value={newDoctorName} onChange={e => setNewDoctorName(e.target.value)} />
            <label>Specialization *</label>
            <input value={newDoctorSpecialization} onChange={e => setNewDoctorSpecialization(e.target.value)} />
            <label>Gender *</label>
            <input value={newDoctorGender} onChange={e => setNewDoctorGender(e.target.value)} />
            <label>Location *</label>
            <select value={newDoctorLocation} onChange={e => setNewDoctorLocation(e.target.value)}>
              <option value="">Select OPD</option>
              {OPDS.map(opd => <option key={opd} value={opd}>{opd}</option>)}
            </select>
            <label>Availability</label>
            <div className="availability-list">
              {newDoctorAvailability.map((a, idx) => (
                <div key={idx} style={{marginBottom:'14px'}}>
                  <select
                    className="availability-day-input"
                    value={a.day}
                    onChange={e => updateAvailabilityDay(idx, e.target.value)}
                  >
                    <option value="">Select day</option>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <button className="remove-btn" type="button" onClick={() => removeAvailabilityEntry(idx)}>Remove Day</button>
                  <div>
                    {a.slots.map((s, sidx) => (
                      <div key={sidx} style={{display:'flex',alignItems:'center',margin:'6px 0'}}>
                        <input
                          className="availability-slot-input"
                          type="time"
                          value={s}
                          onChange={e => updateAvailabilitySlot(idx, sidx, e.target.value)}
                        />
                        <button className="remove-btn" type="button" onClick={() => removeSlotFromAvailability(idx,sidx)}>Remove Slot</button>
                      </div>
                    ))}
                    <button className="avail-btn" type="button" onClick={() => addSlotToAvailability(idx)}>Add Slot</button>
                  </div>
                  <hr style={{margin:'4px 0',border:'0',borderTop:'1px solid #ddd'}}/>
                </div>
              ))}
            </div>
            <button className="avail-btn" type="button" onClick={addAvailabilityEntry}>+ Add Day</button>
            <button className="primary" onClick={submitNewDoctor}>Save Doctor</button>
            <button className="secondary" onClick={() => setShowAddDoctor(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* STYLE */}
      <style jsx>{`
        .header {display:flex;justify-content:space-between;align-items:center;padding:20px 40px;background:linear-gradient(90deg,#e8f1f9,#ffffff);border-bottom:2px solid #c7d7e8;font-family:'Inter',sans-serif;}
        .left {display:flex;align-items:center;gap:20px;}
        .logo {width:50px;height:50px;filter:drop-shadow(0 0 0.2rem #74b9ff);}
        h2 {margin:0;color:#07689f;font-weight:700;}
        .sub {font-size:14px;color:#4a90e2;}
        .right {display:flex;gap:10px;align-items:center;}
        .ghost {background:transparent;border:none;padding:10px 18px;font-weight:600;color:#0d3b66;cursor:pointer;border-radius:8px;}
        .ghost:hover {color:#07457e;background:#ebf2fb;}
        .logout {background:#ff4c4c;padding:10px 18px;border-radius:10px;font-weight:700;color:white;border:none;cursor:pointer;}
        .logout:hover {background:#cc3a3a;}
        .main {padding:32px 40px;max-width:1280px;margin:20px auto;}
        .panelHeader {display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;}
        .primary {background:#05668d;color:white;border:none;padding:10px 18px;border-radius:10px;font-weight:700;cursor:pointer;box-shadow:0 4px 11px rgba(5,102,141,0.3);}
        .primary:hover {background:#0a7ba5;box-shadow:0 6px 14px rgba(10,123,165,0.4);}
        .secondary {background:transparent;border:1.5px solid #98b8d6;color:#3a8dd5;font-weight:700;padding:10px 0;border-radius:12px;cursor:pointer;width:100%;margin-top:6px;}
        .secondary:hover {background:#3a8dd5;color:white;}
        .grid {display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;}
        .card {background:white;border-radius:16px;padding:20px;box-shadow:0 6px 20px rgba(4,104,139,0.08);}
        .card:hover {transform:translateY(-4px);box-shadow:0 10px 28px rgba(4,104,139,0.15);}
        .qnum {background:#bbe1fa;color:#03588c;display:inline-block;font-weight:700;padding:8px 14px;border-radius:10px;margin-bottom:12px;font-size:15px;}
        .muted {color:#7f8c9a;margin-top:6px;font-size:14px;}
        .actions {margin-top:16px;display:flex;gap:12px;flex-wrap:wrap;}
        .actions button {padding:8px 14px;background:transparent;border:1.5px solid #74b9ff;color:#0984e3;border-radius:8px;font-weight:600;cursor:pointer;}
        .actions button:hover {background-color:#74b9ff;color:white;}
        .docName {font-weight:700;color:#0a7ba5;}
        .availability {margin-top:10px;}
        .status strong {padding:6px 12px;border-radius:20px;font-weight:700;color:white;}
        .status strong.waiting {background-color:#f9ca24;}
        .status strong.with_doctor {background-color:#00b894;}
        .status strong.completed {background-color:#0984e3;}
        .apCard {display:flex;justify-content:space-between;align-items:center;background:white;padding:18px 22px;border-radius:14px;margin-bottom:14px;box-shadow:0 8px 18px rgba(0,101,191,0.05);}
        .apDoctor {font-weight:700;color:#05668d;font-size:16px;}
        .apPatient {color:#486581;font-size:14px;}
        .apRight {text-align:right;}
        .apStatus {font-weight:700;color:#0984e3;margin-bottom:8px;}
        .apActions button {margin-left:12px;color:#0984e3;cursor:pointer;background:transparent;border:none;font-weight:600;}
        .apActions button:hover {color:#055a97;}
        .loading {color:#0984e3;font-weight:600;margin-bottom:16px;font-size:16px;}
        .modalBg {position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(3,59,91,0.3);display:flex;justify-content:center;align-items:center;z-index:1001;}
        .modal {background:white;padding:30px 40px;border-radius:16px;max-width:400px;width:90%;box-shadow:0 12px 30px rgba(7,85,140,0.25);font-family:'Inter',sans-serif;color:#144a75;}
        .modal h3 {margin-bottom:20px;font-weight:700;font-size:22px;text-align:center;}
        .modal label {font-weight:600;display:block;margin-bottom:6px;margin-top:14px;font-size:14px;}
        .modal input,.modal select {width:100%;padding:10px 14px;font-size:15px;border:1.8px solid #a7c6df;border-radius:10px;}
        .modal input:focus,.modal select:focus {border-color:#3a8dd5;outline:none;}
        .availability-list {max-height:160px;overflow-y:auto;margin-top:10px;border:1.5px solid #c5d3e4;border-radius:12px;padding:12px;}
        .avail-btn {background:#0984e3;border:none;color:white;padding:6px 12px;border-radius:10px;font-weight:600;cursor:pointer;margin-bottom:10px;}
        .avail-btn:hover {background:#035a8c;}
        .availability-day-input,.availability-slot-input {margin-top:4px;margin-bottom:6px;padding:8px 10px;border:1.5px solid #a7c6df;border-radius:8px;font-size:14px;width:calc(100% - 40px);}
        .remove-btn {background:#ff6b6b;border:none;color:white;padding:6px 10px;border-radius:10px;font-weight:700;cursor:pointer;margin-left:8px;}
        .remove-btn:hover {background:#d44343;}
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet" />
    </div>
  );
}
