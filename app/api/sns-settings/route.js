import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma-new';
import jwt from 'jsonwebtoken';

// 토큰에서 사용자 정보 추출
function getUserFromToken(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

// SNS 설정 조회 (GET)
export async function GET(request) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const snsSettings = await prisma.snsSettings.findUnique({
      where: { userId: user.userId }
    });

    return NextResponse.json({ settings: snsSettings }, { status: 200 });

  } catch (error) {
    console.error('SNS 설정 조회 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// SNS 설정 저장/업데이트 (POST)
export async function POST(request) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { platforms, settings } = body;

    const snsSettings = await prisma.snsSettings.upsert({
      where: { userId: user.userId },
      update: {
        platforms: platforms,
        settings: settings
      },
      create: {
        userId: user.userId,
        platforms: platforms,
        settings: settings
      }
    });

    return NextResponse.json(
      { message: 'SNS 설정이 저장되었습니다', settings: snsSettings },
      { status: 200 }
    );

  } catch (error) {
    console.error('SNS 설정 저장 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}