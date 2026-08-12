import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import AppHeader from "../components/AppHeader";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor } from "../utils/theme";
import {
  answerMarketplaceEventQuestion_API,
  getMarketplaceEventQuestions_API,
} from "../apiFolder/appAPI";
import { getMarketplaceMessageError, styles } from "./marketplaceShared";

const MarketplaceEventMessagesScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const eventId = route?.params?.eventId;
  const bidId = route?.params?.bidId || null;
  const applicationId = route?.params?.applicationId || null;
  const [questions, setQuestions] = useState([]);
  const [qaArchived, setQaArchived] = useState(false);
  const [loading, setLoading] = useState(false);
  const [answerDrafts, setAnswerDrafts] = useState({});
  const [answeringId, setAnsweringId] = useState(null);
  const groupedQuestions = useMemo(
    () => ({
      unread: questions.filter((question) => question.unread),
      read: questions.filter((question) => !question.unread),
    }),
    [questions]
  );

  const loadQuestions = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const response = await getMarketplaceEventQuestions_API(eventId, {
        markRead: true,
        bid_id: bidId,
        application_id: applicationId,
      });
      if (response?.success) {
        setQuestions(response.data?.marketplaceQuestionList || []);
        setQaArchived(!!response.data?.qa_archived);
      }
    } catch (error) {
      Alert.alert("Messages", error?.message || "Unable to load messages.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadQuestions();
    }, [applicationId, bidId, eventId])
  );

  const handleAnswerQuestion = async (questionId) => {
    const answerText = String(answerDrafts[questionId] || "").trim();
    const answerError = getMarketplaceMessageError(answerText);
    if (answerText.length < 3) {
      Alert.alert("Messages", "Enter at least 3 characters before posting.");
      return;
    }
    if (answerError) {
      Alert.alert("Messages", answerError);
      return;
    }

    setAnsweringId(questionId);
    try {
      const response = await answerMarketplaceEventQuestion_API({
        eventId,
        questionId,
        answerText,
      });
      if (response?.success) {
        setAnswerDrafts((prev) => ({ ...prev, [questionId]: "" }));
        await loadQuestions();
      } else if (response?.message) {
        Alert.alert("Messages", response.message);
      }
    } catch (error) {
      Alert.alert("Messages", error?.message || "Unable to post response.");
    } finally {
      setAnsweringId(null);
    }
  };

  const renderQuestion = (question) => {
    const canAnswer = question.status === "PENDING" && !qaArchived;
    const answerError = getMarketplaceMessageError(
      answerDrafts[question.question_id]
    );
    const answerTooShort = String(
      answerDrafts[question.question_id] || ""
    ).trim().length < 3;
    return (
      <View
        key={question.question_id}
        style={{
          borderTopWidth: 1,
          borderTopColor: AppColor.borderColor,
          marginTop: 14,
          paddingTop: 14,
        }}
      >
        <Text style={styles.label}>
          {question.initiated_by_role === "CUSTOMER"
            ? `Coordinator Message to ${question.vendor_display_id}`
            : question.vendor_display_id}
        </Text>
        <Text style={styles.meta}>
          {question.question_text || "Blocked by RTC moderation."}
        </Text>
        {question.answer_text ? (
          <>
            <Text style={styles.label}>Coordinator Response</Text>
            <Text style={styles.meta}>{question.answer_text}</Text>
          </>
        ) : canAnswer ? (
          <>
            <TextInput
              value={answerDrafts[question.question_id] || ""}
              onChangeText={(text) =>
                setAnswerDrafts((prev) => ({
                  ...prev,
                  [question.question_id]: text,
                }))
              }
              placeholder="Response"
              placeholderTextColor={AppColor.textHighlighter}
              multiline
              style={[styles.input, styles.textarea, { marginTop: 12 }]}
            />
            {!!answerError && <Text style={styles.errorText}>{answerError}</Text>}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.button,
                { marginTop: 10 },
                (answeringId === question.question_id || answerTooShort || !!answerError) &&
                  styles.buttonDisabled,
              ]}
              disabled={answeringId === question.question_id || answerTooShort || !!answerError}
              onPress={() => handleAnswerQuestion(question.question_id)}
            >
              <Text style={styles.buttonText}>
                {answeringId === question.question_id ? "Posting..." : "Post Answer"}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.meta}>Awaiting response.</Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />
      <AppHeader headerTitle="Messages" />
      <ScrollView contentContainerStyle={styles.body}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={18} color={AppColor.primary} />
          <Text style={styles.secondaryButtonText}>Back to Event</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.secondaryButton, { marginTop: 10 }]}
          onPress={() => navigation.navigate("marketplaceEventDetailsScreen", { eventId })}
        >
          <MaterialIcons name="open-in-new" size={18} color={AppColor.primary} />
          <Text style={styles.secondaryButtonText}>Open Associated Event</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={styles.title}>Event Messages</Text>
            {qaArchived ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>READ ONLY</Text>
              </View>
            ) : null}
          </View>

          {loading ? (
            <ActivityIndicator
              color={AppColor.primary}
              size="small"
              style={{ marginTop: 16 }}
            />
          ) : questions.length ? (
            <>
              <Text style={[styles.label, { marginTop: 14 }]}>Unread Messages</Text>
              {groupedQuestions.unread.length ? groupedQuestions.unread.map(renderQuestion) : (
                <Text style={styles.meta}>No unread messages.</Text>
              )}
              <Text style={[styles.label, { marginTop: 20 }]}>Read Messages</Text>
              {groupedQuestions.read.length ? groupedQuestions.read.map(renderQuestion) : (
                <Text style={styles.meta}>No read messages.</Text>
              )}
            </>
          ) : (
            <Text style={styles.emptyText}>No messages yet.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default MarketplaceEventMessagesScreen;
