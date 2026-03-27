import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import {
  isPaymentConfirmed,
  PaymentResponse,
  verifyPayment,
} from "../../lib/paymentService";

interface Props {
  visible: boolean;
  paymentData: PaymentResponse | null;
  onSuccess: (result: PaymentResponse) => void;
  onCancel: () => void;
}

type Stage = "form" | "verifying" | "success" | "failed";

// ─── Interswitch-branded payment form HTML ─────────────────────────────────────
function buildPaymentHTML(amount: string, reference: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
    :root {
      --green: #00A651; --green-dark: #007A3D; --green-light: #E6F7EE;
      --surface: #F8FAF9; --border: #D9E8E0; --text: #1A2E24;
      --muted: #6B8576; --error: #D14343;
    }
    body { font-family: 'DM Sans', sans-serif; background: var(--surface); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; }
    header { background: #fff; border-bottom: 1px solid var(--border); padding: 16px 20px; display: flex; align-items: center; gap: 10px; }
    .logo-mark { width: 32px; height: 32px; background: var(--green); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
    .logo-mark svg { width: 18px; height: 18px; }
    header h1 { font-size: 15px; font-weight: 600; color: var(--text); }
    header span { font-size: 13px; color: var(--muted); margin-left: auto; }
    .amount-card { background: linear-gradient(135deg, var(--green) 0%, var(--green-dark) 100%); margin: 20px 20px 0; border-radius: 16px; padding: 20px; color: #fff; box-shadow: 0 4px 24px rgba(0,166,81,0.25); }
    .amount-label { font-size: 12px; opacity: .75; letter-spacing: .5px; text-transform: uppercase; }
    .amount-value { font-size: 32px; font-weight: 600; margin-top: 6px; }
    .amount-ref { font-size: 11px; opacity: .6; margin-top: 4px; }
    form { padding: 20px; flex: 1; }
    .section-label { font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .7px; margin-bottom: 14px; }
    .field { margin-bottom: 14px; }
    label { display: block; font-size: 12px; color: var(--muted); margin-bottom: 5px; font-weight: 500; }
    input { width: 100%; background: #fff; border: 1.5px solid var(--border); border-radius: 10px; padding: 12px 14px; font-size: 15px; font-family: inherit; color: var(--text); outline: none; transition: border-color .15s; -webkit-appearance: none; }
    input:focus { border-color: var(--green); }
    input.error-field { border-color: var(--error); }
    .row { display: flex; gap: 12px; }
    .row .field { flex: 1; }
    .secure-badge { display: flex; align-items: center; gap: 6px; background: var(--green-light); border-radius: 8px; padding: 8px 12px; margin-bottom: 20px; }
    .secure-badge p { font-size: 11px; color: var(--green-dark); font-weight: 500; }
    button[type="submit"] { width: 100%; background: var(--green); color: #fff; border: none; border-radius: 12px; padding: 16px; font-size: 16px; font-weight: 600; font-family: inherit; cursor: pointer; transition: background .15s, transform .1s; -webkit-tap-highlight-color: transparent; }
    button[type="submit"]:active { background: var(--green-dark); transform: scale(.98); }
    button[type="submit"]:disabled { opacity: .5; }
    #overlay { display: none; position: fixed; inset: 0; background: rgba(255,255,255,.85); align-items: center; justify-content: center; flex-direction: column; gap: 14px; z-index: 99; }
    #overlay.show { display: flex; }
    .spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--green); border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    #overlay p { font-size: 14px; color: var(--muted); font-weight: 500; }
    .error-msg { font-size: 11px; color: var(--error); margin-top: 4px; display: none; }
    .error-msg.show { display: block; }
  </style>
</head>
<body>
  <header>
    <div class="logo-mark">
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/>
      </svg>
    </div>
    <h1>Interswitch Secure Pay</h1>
    <span>SSL 🔒</span>
  </header>

  <div class="amount-card">
    <p class="amount-label">Total Due</p>
    <p class="amount-value">&#8358;${parseFloat(amount).toLocaleString()}</p>
    <p class="amount-ref">Ref: ${reference}</p>
  </div>

  <form id="payForm" novalidate>
    <p class="section-label" style="margin-top:20px">Card Details</p>
    <div class="secure-badge">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#007A3D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      <p>Your card data is encrypted and never stored.</p>
    </div>
    <div class="field">
      <label>Card Number</label>
      <input id="cardNumber" type="tel" placeholder="0000  0000  0000  0000" maxlength="19" inputmode="numeric" autocomplete="cc-number" />
      <p class="error-msg" id="cardNumberErr">Enter a valid 16-digit card number.</p>
    </div>
    <div class="field">
      <label>Cardholder Name</label>
      <input id="cardName" type="text" placeholder="As it appears on card" autocomplete="cc-name" />
      <p class="error-msg" id="cardNameErr">Cardholder name is required.</p>
    </div>
    <div class="row">
      <div class="field">
        <label>Expiry</label>
        <input id="expiry" type="tel" placeholder="MM / YY" maxlength="7" inputmode="numeric" autocomplete="cc-exp" />
        <p class="error-msg" id="expiryErr">Invalid expiry.</p>
      </div>
      <div class="field">
        <label>CVV</label>
        <input id="cvv" type="tel" placeholder="&#8226;&#8226;&#8226;" maxlength="4" inputmode="numeric" autocomplete="cc-csc" />
        <p class="error-msg" id="cvvErr">Invalid CVV.</p>
      </div>
    </div>
    <button type="submit" id="payBtn">Pay &#8358;${parseFloat(amount).toLocaleString()}</button>
  </form>

  <div id="overlay">
    <div class="spinner"></div>
    <p>Authorising payment&#8230;</p>
  </div>

  <script>
    const numEl = document.getElementById('cardNumber');
    const expEl = document.getElementById('expiry');
    const payBtn = document.getElementById('payBtn');
    const overlay = document.getElementById('overlay');

    numEl.addEventListener('input', e => {
      let v = e.target.value.replace(/\\D/g, '').slice(0, 16);
      e.target.value = v.replace(/(\\d{4})(?=\\d)/g, '$1  ');
    });
    expEl.addEventListener('input', e => {
      let v = e.target.value.replace(/\\D/g, '').slice(0, 4);
      if (v.length >= 3) v = v.slice(0,2) + ' / ' + v.slice(2);
      e.target.value = v;
    });
    document.getElementById('cvv').addEventListener('input', e => {
      e.target.value = e.target.value.replace(/\\D/g, '').slice(0, 4);
    });

    function show(errId, s) { document.getElementById(errId).classList.toggle('show', s); }
    function markField(f, bad) { f.classList.toggle('error-field', bad); }

    function validate() {
      const card = numEl.value.replace(/\\s/g, '');
      const name = document.getElementById('cardName').value.trim();
      const exp  = expEl.value.replace(/\\s/g, '');
      const cvv  = document.getElementById('cvv').value;
      let ok = true;
      const cardOk = /^\\d{16}$/.test(card);
      markField(numEl, !cardOk); show('cardNumberErr', !cardOk); if (!cardOk) ok = false;
      const nameOk = name.length > 1;
      markField(document.getElementById('cardName'), !nameOk); show('cardNameErr', !nameOk); if (!nameOk) ok = false;
      const expParts = exp.replace('/', '').match(/^(\\d{2})(\\d{2})$/);
      const expOk = expParts && parseInt(expParts[1]) >= 1 && parseInt(expParts[1]) <= 12;
      markField(expEl, !expOk); show('expiryErr', !expOk); if (!expOk) ok = false;
      const cvvOk = /^\\d{3,4}$/.test(cvv);
      markField(document.getElementById('cvv'), !cvvOk); show('cvvErr', !cvvOk); if (!cvvOk) ok = false;
      return ok;
    }

    document.getElementById('payForm').addEventListener('submit', function(e) {
      e.preventDefault();
      if (!validate()) return;
      payBtn.disabled = true;
      overlay.classList.add('show');
      setTimeout(() => {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({ type: 'PAYMENT_SUCCESS', reference: '${reference}' })
        );
      }, 2200);
    });
  </script>
</body>
</html>`;
}

// ─── Verifying overlay ─────────────────────────────────────────────────────────
function VerifyingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900 px-8">
      <ActivityIndicator size="large" color="#00A651" />
      <Text className="text-base font-semibold text-gray-700 dark:text-gray-200 mt-5">
        Confirming your payment…
      </Text>
      <Text className="text-sm text-gray-400 dark:text-gray-500 mt-2 text-center">
        Please wait while we verify your transaction with Interswitch.
      </Text>
    </View>
  );
}

// ─── Success screen ────────────────────────────────────────────────────────────
function SuccessScreen({
  amount,
  reference,
  onDone,
}: {
  amount: string;
  reference: string;
  onDone: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900 px-8">
      <View className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/40 items-center justify-center mb-6">
        <View className="w-16 h-16 rounded-full bg-green-500 items-center justify-center">
          <Ionicons name="checkmark" size={36} color="#fff" />
        </View>
      </View>

      <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Payment Successful
      </Text>
      <Text className="text-3xl font-black text-green-500 mb-4">
        ₦{parseFloat(amount).toLocaleString()}
      </Text>
      <Text className="text-sm text-gray-400 dark:text-gray-500 text-center mb-1">
        Transaction Reference
      </Text>
      <Text className="text-xs font-mono text-gray-500 dark:text-gray-400 text-center mb-10 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-lg">
        {reference}
      </Text>

      <TouchableOpacity
        onPress={onDone}
        className="w-full bg-green-500 py-4 rounded-xl items-center"
      >
        <Text className="text-white text-base font-bold">Done</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Failed screen ─────────────────────────────────────────────────────────────
function FailedScreen({
  onRetry,
  onCancel,
}: {
  onRetry: () => void;
  onCancel: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900 px-8">
      <View className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/40 items-center justify-center mb-6">
        <View className="w-16 h-16 rounded-full bg-red-500 items-center justify-center">
          <Ionicons name="close" size={36} color="#fff" />
        </View>
      </View>

      <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Payment Failed
      </Text>
      <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-10">
        We couldn't confirm your payment. No charge has been made. You can try again or go back.
      </Text>

      <TouchableOpacity
        onPress={onRetry}
        className="w-full bg-orange-500 py-4 rounded-xl items-center mb-3"
      >
        <Text className="text-white text-base font-bold">Try Again</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onCancel} className="w-full py-3 items-center">
        <Text className="text-gray-500 dark:text-gray-400 text-sm font-medium">Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main modal ────────────────────────────────────────────────────────────────
export default function InterswitchPaymentModal({
  visible,
  paymentData,
  onSuccess,
  onCancel,
}: Props) {
  const webViewRef = useRef<WebView>(null);
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [stage, setStage] = useState<Stage>("form");
  const [verifyResult, setVerifyResult] = useState<PaymentResponse | null>(null);

  // Reset every time the modal opens fresh
  const handleModalShow = () => {
    setStage("form");
    setWebViewLoading(true);
    setVerifyResult(null);
  };

  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type !== "PAYMENT_SUCCESS") return;

      setStage("verifying");

      try {
        const result = await verifyPayment(msg.reference);
        setVerifyResult(result);
        setStage(isPaymentConfirmed(result) ? "success" : "failed");
      } catch {
        setStage("failed");
      }
    } catch {
      // Non-JSON WebView message, ignore
    }
  };

  const handleRetry = () => {
    setStage("form");
    setWebViewLoading(true);
    setVerifyResult(null);
  };

  const html = paymentData
    ? buildPaymentHTML(paymentData.amount, paymentData.transaction_reference)
    : "";

  const headerTitle =
    stage === "success" ? "Payment Confirmed" :
    stage === "failed"  ? "Payment Failed"   :
    stage === "verifying" ? "Verifying…"     :
    "Secure Payment";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onShow={handleModalShow}
      onRequestClose={stage === "form" ? onCancel : undefined}
    >
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={["top"]}>

        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800">
          <Text className="text-base font-bold text-gray-900 dark:text-white">
            {headerTitle}
          </Text>
          {/* Only show × on form stage – other stages have explicit CTAs */}
          {stage === "form" && (
            <TouchableOpacity
              onPress={onCancel}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Stage screens */}
        {stage === "verifying" && <VerifyingScreen />}

        {stage === "success" && verifyResult && (
          <SuccessScreen
            amount={verifyResult.amount}
            reference={verifyResult.transaction_reference}
            onDone={() => onSuccess(verifyResult)}
          />
        )}

        {stage === "failed" && (
          <FailedScreen onRetry={handleRetry} onCancel={onCancel} />
        )}

        {/*
          WebView stays mounted to avoid re-parsing the HTML on retry.
          We hide it with display:none instead of unmounting.
        */}
        <View
          className="flex-1"
          style={{ display: stage === "form" ? "flex" : "none" }}
        >
          {webViewLoading && (
            <View className="absolute inset-0 items-center justify-center bg-white dark:bg-gray-900 z-10">
              <ActivityIndicator size="large" color="#00A651" />
            </View>
          )}
          <WebView
            ref={webViewRef}
            source={{ html }}
            originWhitelist={["*"]}
            javaScriptEnabled
            onMessage={handleMessage}
            onLoadEnd={() => setWebViewLoading(false)}
            scrollEnabled
            keyboardDisplayRequiresUserAction={false}
            onShouldStartLoadWithRequest={(req) => req.url === "about:blank"}
          />
        </View>

      </SafeAreaView>
    </Modal>
  );
}