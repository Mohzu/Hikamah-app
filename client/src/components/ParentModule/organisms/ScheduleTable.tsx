// client/src/components/ParentModule/organisms/ScheduleTable.tsx

import React, { useEffect, useState } from 'react';
import { Calendar, Clock, BookOpen, User } from 'lucide-react';
import { toast } from 'react-toastify';

interface JadwalItem {
  mata_pelajaran: string;
  nama_guru: string;
  waktu: string;
}

interface JadwalPelajaran {
  [hari: string]: JadwalItem[];
}

interface ScheduleTableProps {
  jadwal: JadwalPelajaran;
  tahunAjaran: string;
}

const getDayColor = (day: string) => {
  const colors: { [key: string]: string } = {
    'Senin': 'bg-blue-100 text-blue-800',
    'Selasa': 'bg-green-100 text-green-800',
    'Rabu': 'bg-yellow-100 text-yellow-800',
    'Kamis': 'bg-purple-100 text-purple-800',
    'Jumat': 'bg-red-100 text-red-800',
  };
  return colors[day] || 'bg-gray-100 text-gray-800';
};

const dayMap: { [key: number]: string } = {
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
  0: 'Minggu',
};

export const ScheduleTable: React.FC<ScheduleTableProps> = ({ jadwal, tahunAjaran }) => {
  const orderedDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  const [notifiedSchedules, setNotifiedSchedules] = useState<string[]>([]);

  useEffect(() => {
    const checkSchedules = () => {
      const now = new Date();
      const currentDayName = dayMap[now.getDay()];
      const todaySchedules = jadwal[currentDayName];

      if (todaySchedules) {
        todaySchedules.forEach(schedule => {
          const startTimeStr = schedule.waktu.split(' - ')[0];
          const [hours, minutes] = startTimeStr.split(':').map(Number);

          const scheduleTime = new Date();
          scheduleTime.setHours(hours, minutes, 0, 0);

          const diffInMinutes = Math.round((scheduleTime.getTime() - now.getTime()) / 60000);

          const scheduleId = `${currentDayName}-${schedule.waktu}-${schedule.mata_pelajaran}`;

          if (diffInMinutes === 30 && !notifiedSchedules.includes(scheduleId)) {
            toast.info(`Pelajaran ${schedule.mata_pelajaran} akan dimulai dalam 30 menit.`, {
              autoClose: 10000, // Notifikasi akan hilang setelah 10 detik
            });
            setNotifiedSchedules(prev => [...prev, scheduleId]);
          }
        });
      }
    };

    // Jalankan pengecekan setiap menit
    const intervalId = setInterval(checkSchedules, 60000);

    // Bersihkan interval saat komponen dilepas
    return () => clearInterval(intervalId);

  }, [jadwal, notifiedSchedules]);

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center text-white">
          <Calendar size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Jadwal Mata Pelajaran</h2>
        </div>
      </div>
      
      {Object.keys(jadwal).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {orderedDays.map(day => {
            const schedulesForDay = jadwal[day];
            if (!schedulesForDay || schedulesForDay.length === 0) return null;
            
            return (
              <div key={day} className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                <span className={`inline-block px-4 py-1 rounded-full text-sm font-semibold mb-4 ${getDayColor(day)}`}>
                  {day}
                </span>
                <div className="space-y-4">
                  {schedulesForDay.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4 border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow">
                        <BookOpen size={20} className="text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.mata_pelajaran}</p>
                        <p className="text-sm text-gray-600 flex items-center">
                          <User size={14} className="mr-1 text-gray-400" />
                          {item.nama_guru}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-indigo-600 flex items-center">
                          <Clock size={14} className="mr-1" />
                          {item.waktu}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">Tidak ada jadwal ditemukan untuk tahun ajaran ini.</p>
        </div>
      )}
    </div>
  );
};