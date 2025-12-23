'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function AvailabilityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPrayers, setSelectedPrayers] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: string; message: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;

  const prayerTimes = ['Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak'];

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session) {
      const role = (session.user as any).role;
      const additionalRoles = (session.user as any).additionalRoles || [];
      const allRoles = [role, ...additionalRoles];

      // Check if user has imam or bilal role (either primary or additional)
      const hasAccess = allRoles.some((r: string) => ['imam', 'bilal'].includes(r));

      if (!hasAccess) {
        router.push('/dashboard');
      } else {
        fetchAvailability();
      }
    }
  }, [status, session, router]);

  const fetchAvailability = async () => {
    if (!session) return;

    const userId = (session.user as any).id;
    try {
      const response = await fetch(`/api/availability?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setAvailability(data);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const togglePrayer = (prayer: string) => {
    setSelectedPrayers(prev =>
      prev.includes(prayer)
        ? prev.filter(p => p !== prayer)
        : [...prev, prayer]
    );
  };

  // Helper function to get all dates between start and end
  const getDateRange = (start: string, end: string): string[] => {
    const dates: string[] = [];
    const currentDate = new Date(start);
    const endDateObj = new Date(end);

    while (currentDate <= endDateObj) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!startDate) {
      showAlert('danger', 'Please select a start date');
      setLoading(false);
      return;
    }

    // If no end date, use start date (single day)
    const effectiveEndDate = endDate || startDate;

    if (new Date(effectiveEndDate) < new Date(startDate)) {
      showAlert('danger', 'End date cannot be before start date');
      setLoading(false);
      return;
    }

    if (selectedPrayers.length === 0) {
      showAlert('danger', 'Please select at least one prayer time');
      setLoading(false);
      return;
    }

    const userId = (session?.user as any).id;
    const dates = getDateRange(startDate, effectiveEndDate);

    // Limit to max 30 days to prevent too many requests
    if (dates.length > 30) {
      showAlert('danger', 'Maximum date range is 30 days');
      setLoading(false);
      return;
    }

    try {
      // Submit unavailability for each date and each selected prayer time
      const promises: Promise<Response>[] = [];
      dates.forEach(date => {
        selectedPrayers.forEach(prayer => {
          promises.push(
            fetch('/api/availability', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: userId,
                date: date,
                prayer_time: prayer,
                is_available: false,
                reason: reason,
              }),
            })
          );
        });
      });

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.ok).length;
      const totalCount = promises.length;

      if (successCount === totalCount) {
        const dayText = dates.length === 1 ? '1 day' : `${dates.length} days`;
        showAlert('success', `Unavailability marked for ${selectedPrayers.length} prayer time(s) x ${dayText} successfully!`);
        setStartDate('');
        setEndDate('');
        setSelectedPrayers([]);
        setReason('');
        setCurrentPage(1); // Reset to first page to show latest entries
        fetchAvailability();
      } else {
        showAlert('warning', `${successCount} of ${totalCount} entries saved. Some may already exist.`);
        fetchAvailability();
      }
    } catch (error) {
      showAlert('danger', 'Error saving unavailability');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type: string, message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleRemoveUnavailability = async (availabilityId: number) => {
    if (!confirm('Are you sure you want to remove this unavailability? You will be marked as available for this slot.')) {
      return;
    }

    try {
      const response = await fetch(`/api/availability/${availabilityId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showAlert('success', 'Unavailability removed successfully! You are now available for this slot.');
        setCurrentPage(1); // Reset to first page
        fetchAvailability();
      } else {
        const errorData = await response.json();
        console.error('Failed to remove unavailability:', errorData);
        showAlert('danger', errorData.error || 'Failed to remove unavailability');
      }
    } catch (error) {
      console.error('Error removing unavailability:', error);
      showAlert('danger', 'Error removing unavailability');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-MY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (status === 'loading' || !session) {
    return (
      <div className="loading">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    );
  }

  // Filter unavailable slots and sort by latest date first
  const unavailableSlots = availability
    .filter((a) => !a.is_available)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate pagination
  const totalPages = Math.ceil(unavailableSlots.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = unavailableSlots.slice(indexOfFirstRecord, indexOfLastRecord);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        {alert && (
          <div className={`alert alert-${alert.type} alert-custom`} role="alert">
            {alert.message}
          </div>
        )}

        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex align-items-center mb-2">
              <i className="bi bi-calendar-x me-3" style={{ fontSize: '2.5rem', color: '#059669' }}></i>
              <div>
                <h2 className="mb-1">My Availability</h2>
                <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                  <i className="bi bi-info-circle me-2"></i>
                  Manage your unavailability for prayer duties
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header text-white">
                <h5 className="mb-0">
                  <i className="bi bi-calendar-plus me-2"></i>Mark Unavailability
                </h5>
              </div>
              <div className="card-body">
                <div className="alert alert-info" style={{ fontSize: '0.9rem' }}>
                  <i className="bi bi-info-circle me-2"></i>
                  Use this form to indicate when you cannot be on duty for prayer.
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="row mb-3">
                    <div className="col-6">
                      <label htmlFor="startDate" className="form-label">
                        Start Date
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        id="startDate"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          // Auto-set end date if empty or before start date
                          if (!endDate || e.target.value > endDate) {
                            setEndDate(e.target.value);
                          }
                        }}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label htmlFor="endDate" className="form-label">
                        End Date <small className="text-muted">(optional)</small>
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        id="endDate"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  {startDate && endDate && startDate !== endDate && (
                    <div className="alert alert-info py-2 mb-3" style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-calendar-range me-2"></i>
                      <strong>{(() => {
                        const start = new Date(startDate);
                        const end = new Date(endDate);
                        const diffTime = Math.abs(end.getTime() - start.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                        return diffDays;
                      })()}</strong> day(s) will be marked as unavailable
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">
                      Prayer Times (Select one or more)
                    </label>
                    <div className="border rounded p-3">
                      <div className="d-flex gap-2 mb-2 pb-2 border-bottom">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success"
                          onClick={() => setSelectedPrayers([...prayerTimes])}
                        >
                          <i className="bi bi-check-all me-1"></i>Select All
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setSelectedPrayers([])}
                        >
                          <i className="bi bi-x-lg me-1"></i>Deselect All
                        </button>
                      </div>
                      {prayerTimes.map((prayer) => (
                        <div key={prayer} className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`prayer-${prayer}`}
                            checked={selectedPrayers.includes(prayer)}
                            onChange={() => togglePrayer(prayer)}
                          />
                          <label
                            className="form-check-label"
                            htmlFor={`prayer-${prayer}`}
                          >
                            {prayer}
                          </label>
                        </div>
                      ))}
                    </div>
                    {selectedPrayers.length > 0 && (
                      <small className="text-muted">
                        {selectedPrayers.length} prayer time(s) selected
                      </small>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="reason" className="form-label">
                      Reason (Optional)
                    </label>
                    <textarea
                      className="form-control"
                      id="reason"
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="E.g., Out of town, Medical appointment, etc."
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-success w-100 d-flex align-items-center justify-content-center"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Mark as Unavailable
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card">
              <div className="card-header text-white">
                <h5 className="mb-0">
                  <i className="bi bi-list-check me-2"></i>My Unavailable Slots
                </h5>
              </div>
              <div className="card-body">
                {unavailableSlots.length === 0 ? (
                  <div className="empty-state text-center py-4">
                    <i className="bi bi-check-circle" style={{ fontSize: '3rem', color: '#10b981' }}></i>
                    <h5 className="mt-3 mb-2">All Clear!</h5>
                    <p className="text-muted">You have no unavailable slots marked. You are available for all prayer duties.</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      <small className="text-muted">
                        Showing {indexOfFirstRecord + 1} - {Math.min(indexOfLastRecord, unavailableSlots.length)} of {unavailableSlots.length} unavailable slots
                      </small>
                    </div>
                    <div className="list-group">
                      {currentRecords.map((slot) => (
                        <div key={slot.id} className="list-group-item">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <h6 className="mb-1">{formatDate(slot.date)}</h6>
                              <p className="mb-1">
                                <strong>Prayer:</strong> {slot.prayer_time}
                              </p>
                              {slot.reason && (
                                <p className="mb-0 text-muted">
                                  <small>{slot.reason}</small>
                                </p>
                              )}
                            </div>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleRemoveUnavailability(slot.id)}
                              title="Remove this unavailability and mark as available"
                            >
                              <i className="bi bi-trash"></i> Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <nav className="mt-3">
                        <ul className="pagination pagination-sm justify-content-center">
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                            >
                              Previous
                            </button>
                          </li>
                          {[...Array(totalPages)].map((_, index) => (
                            <li
                              key={index + 1}
                              className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                            >
                              <button
                                className="page-link"
                                onClick={() => handlePageChange(index + 1)}
                              >
                                {index + 1}
                              </button>
                            </li>
                          ))}
                          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages}
                            >
                              Next
                            </button>
                          </li>
                        </ul>
                      </nav>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
