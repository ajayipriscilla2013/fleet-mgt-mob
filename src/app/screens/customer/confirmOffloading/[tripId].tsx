import API from "@/src/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import { z } from "zod";

const offLoadingPointSchema = z.object({
  offloading_qty: z.number().min(1, "Loading Quantity is required"),
  remarks: z.string().min(1, "Remark is required"),
});

const OffloadingPointScreen = () => {
  const { tripId } = useLocalSearchParams();
  console.log("trip_ID from confirmLoading", tripId);

  const router = useRouter();
  const [formData, setFormData] = useState({
    trip_id: tripId,
    offloading_qty: "",
    remarks: "",
    dataname: "customerOffloadingPoint",
  });

  const [focusedField, setFocusedField] = useState(null);
  const [errors, setErrors] = useState({}); // To hold form errors

  const submitLoadingData = async (data) => {
    const userId = await AsyncStorage.getItem("user_id");
    const response = await API.post("trip/trip.php", {
      dataname: "customerOffloadingPoint",
      customer_id: userId,
      ...data,
    });
    return response.data;
  };

  const mutation = useMutation({
    mutationFn: submitLoadingData,
    onSuccess: () => {
      console.log("OffLoading point data submitted");
      Alert.alert("Success", "OffLoading point data submitted");
      // Handle success (e.g., show a success message, navigate to next screen)
      router.push("/(customer)/Trip?tab=completed");
    },
    onError: (error) => {
      // Check if the error response contains a message
      const errorMessage =
        error.response?.data?.message || "Request Failed, Try Again";

      console.error("Error submitting data:", error);
      Alert.alert("Error", `${errorMessage}`);
    },
  });

  const handleInputChange = (name, value) => {
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = () => {
    setErrors({});
    const updatedFormData = {
      ...formData,
      offloading_qty: Number(formData.offloading_qty), // Convert to number
    };

    const result = offLoadingPointSchema.safeParse(updatedFormData);
    if (!result.success) {
      const fieldErrors = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    mutation.mutate(updatedFormData);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 bg-[#F9F9F9] px-6 pt-6">
        {[
          {
            label: "Tonnage Offloaded",
            name: "offloading_qty",
            value: "Enter tonnage offloaded",
            numeric:true
          },
          {
            label: "Remark",
            name: "remarks",
            value: "Enter Remark",
            placeholder: "Enter Remark",
            textarea: "true",
          },
        ].map((item, index) => (
          <View key={index} className="mb-4">
            <View className="flex-row justify-between">
              <Text className="text-gray-600 mb-[10px]">{item.label}</Text>
              {errors[item.name] && (
                <Text className="mb-2" style={{ color: "red" }}>
                  {errors[item.name]}
                </Text>
              )}
            </View>
            {
              <TextInput
                onFocus={() => setFocusedField(item.name)}
                onBlur={() => setFocusedField(null)}
                className={`border bg-white rounded-md p-2 h-[60px] ${
                  focusedField === item.name
                    ? "border-[#394F91] shadow-[0px 0px 0px 4px rgba(57,79,145,0.1)]"
                    : "border-[#C4CCF0] shadow-[0px 1px 2px rgba(16,24,40,0.05)]"
                }`}
                placeholder={item.placeholder}
                value={formData[item.name]}
                onChangeText={(text) => handleInputChange(item.name, text)}
                keyboardType={item.numeric?"numeric":"default"}
              />
            }
          </View>
        ))}

        <TouchableOpacity
          className="bg-[#394F91] rounded-2xl p-4 mt-6"
          onPress={handleSubmit}
          disabled={mutation.isPending}
        >
          <Text className="text-white text-center font-semibold">
            {mutation.isPending ? "Submitting..." : "Confirm Offloading Point"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OffloadingPointScreen;
