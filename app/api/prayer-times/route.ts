import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// JAKIM e-solat zone for Kajang, Selangor
const ZONE = 'SGR01';

export async function GET() {
  try {
    // Fetch from JAKIM e-solat API
    const response = await fetch(
      `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=today&zone=${ZONE}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from JAKIM API');
    }

    const data = await response.json();

    if (data.status === 'OK!' && data.prayerTime && data.prayerTime.length > 0) {
      const todayPrayer = data.prayerTime[0];

      return NextResponse.json({
        Subuh: todayPrayer.fajr,
        Zohor: todayPrayer.dhuhr,
        Asar: todayPrayer.asr,
        Maghrib: todayPrayer.maghrib,
        Isyak: todayPrayer.isha,
        date: todayPrayer.date,
        hijri: todayPrayer.hijri,
        zone: ZONE
      });
    }

    // Fallback: return empty if API fails
    return NextResponse.json({
      Subuh: '-',
      Zohor: '-',
      Asar: '-',
      Maghrib: '-',
      Isyak: '-',
      error: 'Data tidak tersedia'
    });

  } catch (error) {
    console.error('Error fetching prayer times:', error);

    // Return fallback data
    return NextResponse.json({
      Subuh: '-',
      Zohor: '-',
      Asar: '-',
      Maghrib: '-',
      Isyak: '-',
      error: 'Gagal mendapatkan waktu solat'
    });
  }
}
