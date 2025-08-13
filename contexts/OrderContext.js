'use client';
import { createContext, useContext, useState, useCallback } from 'react';

const OrderContext = createContext();

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // 주문 생성
  const createOrder = async (orderData) => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('title', orderData.title);
      formData.append('description', orderData.description);
      formData.append('priority', orderData.priority);
      if (orderData.dueDate) {
        formData.append('dueDate', orderData.dueDate);
      }
      
      // 파일들 추가 - AI 생성 이미지와 일반 파일을 다르게 처리
      let fileIndex = 0;
      for (const file of orderData.files) {
        if (file.isGenerated) {
          // AI 생성 이미지의 경우 URL을 메타데이터로 전송
          formData.append(`generatedFile${fileIndex}`, JSON.stringify({
            name: file.name,
            url: file.url,
            type: file.type,
            isGenerated: true
          }));
        } else {
          // 일반 파일의 경우 직접 추가
          formData.append(`file${fileIndex}`, file);
        }
        fileIndex++;
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, order: data.order, message: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('주문 생성 에러:', error);
      return { success: false, error: '네트워크 오류가 발생했습니다' };
    } finally {
      setLoading(false);
    }
  };

  // 주문 목록 조회
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/orders');
      const data = await response.json();

      if (response.ok) {
        setOrders(data.orders);
        return { success: true, orders: data.orders };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('주문 조회 에러:', error);
      return { success: false, error: '네트워크 오류가 발생했습니다' };
    } finally {
      setLoading(false);
    }
  }, []);

  // 주문 상세 조회
  const fetchOrder = async (orderId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      const data = await response.json();

      if (response.ok) {
        return { success: true, order: data.order };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('주문 상세 조회 에러:', error);
      return { success: false, error: '네트워크 오류가 발생했습니다' };
    }
  };

  // 주문 업데이트 (피드백, 상태 변경 등)
  const updateOrder = async (orderId, updateData) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        // 로컬 상태 업데이트
        setOrders(prev => prev.map(order => 
          order._id === orderId ? data.order : order
        ));
        return { success: true, order: data.order, message: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('주문 업데이트 에러:', error);
      return { success: false, error: '네트워크 오류가 발생했습니다' };
    }
  };

  const value = {
    orders,
    loading,
    createOrder,
    fetchOrders,
    fetchOrder,
    updateOrder
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}