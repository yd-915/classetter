/* eslint-disable react/destructuring-assignment */
import { useEffect, useState } from "react";
import Modal from "../../Modal";
import { ClipboardCheckIcon } from "@heroicons/react/outline";
import { supabase } from "../../../utils/supabase";
import {
  poundsToKilograms,
  kilogramsToPounds,
} from "../../../utils/exercise-utils";
import { useClient } from "../../../context/client-context";
import ExerciseTypesSelect from "./ExerciseTypesSelect";
import { useUser } from "../../../context/user-context";

export default function ExerciseModal(props) {
  const {
    open,
    setOpen,
    setCreateResultStatus: setAddExerciseStatus,
    setShowCreateResultNotification: setShowAddExerciseNotification,
    existingExercises,

    selectedResult: selectedExercise,
    setSelectedResult: setSelectedExercise,
    setEditResultStatus: setEditExerciseStatus,
    setShowEditResultNotification: setShowEditExerciseNotification,
  } = props;

  const { selectedClient, selectedDate, amITheClient } = useClient();
  const { user } = useUser();

  useEffect(() => {
    if (!open) {
      setDidAddExercise(false);
      setDidUpdateExercise(false);
      resetUI();
    }
  }, [open]);

  useEffect(() => {
    if (open && didAddExercise) {
      setShowAddExerciseNotification(false);
      setShowEditExerciseNotification(false);
    }
  }, [open]);

  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [didAddExercise, setDidAddExercise] = useState(false);

  const [isUpdatingExercise, setIsUpdatingExercise] = useState(false);
  const [didUpdateExercise, setDidUpdateExercise] = useState(false);

  const [selectedExerciseType, setSelectedExerciseType] = useState(null);
  const [numberOfSets, setNumberOfSets] = useState(3);
  const [numberOfSetsPerformed, setNumberOfSetsPerformed] = useState(0);

  const [sameRepsForEachSet, setSameRepsForEachSet] = useState(true);
  const [numberOfReps, setNumberOfReps] = useState([10]);
  const [numberOfRepsPerformed, setNumberOfRepsPerformed] = useState(0);

  const [sameWeightForEachSet, setSameWeightForEachSet] = useState(true);
  const [isUsingKilograms, setIsUsingKilograms] = useState(true);
  const [weightKilograms, setWeightKilograms] = useState([0]);
  const [weightPounds, setWeightPounds] = useState([0]);

  const [isWeightInputEmptyString, setIsWeightInputEmptyString] = useState([]);

  const resetUI = () => {
    setIsAddingExercise(false);
    setDidAddExercise(false);
    setSelectedExerciseType(null);
    setNumberOfSets(3);
    setNumberOfReps([10]);
    setWeightKilograms([0]);
    setWeightPounds([0]);
    setIsWeightInputEmptyString([]);
    setSameRepsForEachSet(true);
    setSameWeightForEachSet(true);

    setIsUpdatingExercise(false);
    setDidUpdateExercise(false);
    setSelectedExercise?.(null);
  };

  useEffect(() => {
    if (open && selectedExercise) {
      setNumberOfSets(selectedExercise.number_of_sets_assigned);
      setNumberOfReps(selectedExercise.number_of_reps_assigned);
      setIsUsingKilograms(selectedExercise.is_weight_in_kilograms);
      if (selectedExercise.is_weight_in_kilograms) {
        setWeightKilograms(selectedExercise.weight_assigned);
        setWeightPounds(
          selectedExercise.weight_assigned.map((weight) =>
            kilogramsToPounds(weight)
          )
        );
      } else {
        setWeightPounds(selectedExercise.weight_assigned);
        setWeightKilograms(
          selectedExercise.weight_assigned.map((weight) =>
            poundsToKilograms(weight)
          )
        );
      }

      const sameRepsForEachSet =
        selectedExercise.number_of_reps_assigned.length == 1;
      setSameRepsForEachSet(sameRepsForEachSet);

      const sameWeightForEachSet = selectedExercise.weight_assigned.length == 1;
      setSameWeightForEachSet(sameWeightForEachSet);

      if (selectedExercise.number_of_sets_performed !== null) {
        setNumberOfSetsPerformed(selectedExercise.number_of_sets_performed);
      } else {
        setNumberOfSetsPerformed(selectedExercise.number_of_sets_assigned);
      }

      if (selectedExercise.number_of_reps_performed !== null) {
        setNumberOfRepsPerformed(selectedExercise.number_of_reps_performed);
      } else {
        setNumberOfRepsPerformed(selectedExercise.number_of_reps_assigned);
      }
    }
  }, [open, selectedExercise]);

  return (
    <Modal
      {...props}
      title={selectedExercise ? "Edit Exercise" : "Add Exercise"}
      message={
        <>
          {selectedExercise ? "Update" : "Add an"} exercise to{" "}
          <span className="font-semibold">
            {selectedClient ? `${selectedClient.client_email}'s` : "your"}
          </span>{" "}
          workout for{" "}
          <span className="font-semibold">{selectedDate.toDateString()}</span>
        </>
      }
      Icon={ClipboardCheckIcon}
      Button={
        <button
          type="submit"
          form="exerciseForm"
          className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
        >
          {selectedExercise
            ? isUpdatingExercise
              ? "Updating Exercise..."
              : didUpdateExercise
              ? "Updated Exercise!"
              : "Update Exercise"
            : isAddingExercise
            ? "Adding Exercise..."
            : didAddExercise
            ? "Added Exercise!"
            : "Add Exercise"}
        </button>
      }
    >
      <form
        id="exerciseForm"
        method="POST"
        className="my-5 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3"
        onSubmit={async (e) => {
          e.preventDefault();
          let status;
          if (selectedExercise) {
            const updateExerciseData = {
              type: selectedExerciseType.id,
              number_of_sets_assigned: numberOfSets,
              number_of_reps_assigned: numberOfReps,
              is_weight_in_kilograms: isUsingKilograms,
              weight_assigned: isUsingKilograms
                ? weightKilograms
                : weightPounds,

              // FILL - more stuff
              number_of_sets_performed: numberOfSetsPerformed,
              number_of_reps_performed: numberOfRepsPerformed,
            };
            const { data: updatedExercise, error: updatedExerciseError } =
              await supabase
                .from("exercise")
                .update(updateExerciseData)
                .match({ id: selectedExercise.id });

            console.log("updatedExercise", updatedExercise);
            if (updatedExerciseError) {
              console.error(updatedExerciseError);
              status = {
                type: "failed",
                title: "Failed to Update Exercise",
                message: updatedExerciseError.message,
              };
            } else {
              status = {
                type: "succeeded",
                title: "Successfully Updated Exercise",
              };
            }
            setIsUpdatingExercise(false);
            setDidUpdateExercise(true);
            setEditExerciseStatus(status);
            setShowEditExerciseNotification(true);
          } else {
            setIsAddingExercise(true);
            const createExerciseData = {
              type: selectedExerciseType.id,
              date: selectedDate,
              number_of_sets_assigned: numberOfSets,
              number_of_reps_assigned: numberOfReps,
              is_weight_in_kilograms: isUsingKilograms,
              weight_assigned: isUsingKilograms
                ? weightKilograms
                : weightPounds,

              client: amITheClient ? user.id : selectedClient.client,
              client_email: amITheClient
                ? user.email
                : selectedClient.client_email,
            };
            if (!amITheClient) {
              Object.assign(createExerciseData, {
                coach: user.id,
                coach_email: user.email,
              });
            }
            console.log("createExerciseData", createExerciseData);
            const { data: createdExercise, error: createdExerciseError } =
              await supabase.from("exercise").insert([createExerciseData]);

            console.log("createdExercise", createdExercise);
            if (createdExerciseError) {
              console.error(createdExerciseError);
              status = {
                type: "failed",
                title: "Failed to add Exercise",
                message: createdExerciseError.message,
              };
            } else {
              status = {
                type: "succeeded",
                title: "Successfully added Exercise",
              };
            }
            setIsAddingExercise(false);
            setDidAddExercise(true);
            setAddExerciseStatus(status);
            setShowAddExerciseNotification(true);
          }

          setOpen(false);
          if (status.type === "succeeded") {
            console.log(status);
          } else {
            console.error(status);
          }
        }}
      >
        <div className="sm:col-span-3">
          <ExerciseTypesSelect
            selectedExerciseType={selectedExerciseType}
            setSelectedExerciseType={setSelectedExerciseType}
            open={open}
            existingExercises={existingExercises}
            selectedExercise={selectedExercise}
          />
        </div>
        <div className="">
          <label
            htmlFor="sets"
            className="block text-sm font-medium text-gray-700"
          >
            Assigned Sets
          </label>
          <div className="mt-1">
            <input
              required
              type="number"
              min="1"
              max="10"
              value={numberOfSets}
              onInput={(e) => {
                const newNumberOfSets = Number(e.target.value);
                if (sameRepsForEachSet) {
                  setNumberOfReps([numberOfReps[0]]);
                  setWeightKilograms([weightKilograms[0]]);
                  setWeightPounds([weightPounds[0]]);
                  setIsWeightInputEmptyString([isWeightInputEmptyString[0]]);
                } else {
                  setNumberOfReps(
                    new Array(newNumberOfSets).fill(numberOfReps[0])
                  );
                  setWeightKilograms(
                    new Array(newNumberOfSets).fill(weightKilograms[0])
                  );
                  setWeightPounds(
                    new Array(newNumberOfSets).fill(weightPounds[0])
                  );
                  setIsWeightInputEmptyString(
                    new Array(newNumberOfSets).fill(isWeightInputEmptyString[0])
                  );
                }
                setNumberOfSets(newNumberOfSets);
              }}
              name="sets"
              id="sets"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
        <div className="relative flex self-center">
          <div className="flex h-5 items-center">
            <input
              id="sameRepsForEachSet"
              name="sameRepsForEachSet"
              type="checkbox"
              checked={sameRepsForEachSet}
              onChange={(e) => {
                const newSameRepsForEachSet = e.target.checked;
                if (newSameRepsForEachSet) {
                  setNumberOfReps([numberOfReps[0]]);
                } else {
                  setNumberOfReps(
                    new Array(numberOfSets).fill(numberOfReps[0])
                  );
                }
                setSameRepsForEachSet(newSameRepsForEachSet);
              }}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <div className="ml-3 text-sm">
            <label
              htmlFor="sameRepsForEachSet"
              className="font-medium text-gray-700"
            >
              Same Reps for Each Set
            </label>
          </div>
        </div>
        <div className="relative flex self-center">
          <div className="flex h-5 items-center">
            <input
              id="sameWeightForEachSet"
              name="sameWeightForEachSet"
              type="checkbox"
              checked={sameWeightForEachSet}
              onChange={(e) => {
                const newSameWeightForEachSet = e.target.checked;
                if (newSameWeightForEachSet) {
                  setWeightKilograms([weightKilograms[0]]);
                  setWeightPounds([weightPounds[0]]);
                  setIsWeightInputEmptyString([isWeightInputEmptyString[0]]);
                } else {
                  setWeightKilograms(
                    new Array(numberOfSets).fill(weightKilograms[0])
                  );
                  setWeightPounds(
                    new Array(numberOfSets).fill(weightPounds[0])
                  );
                  setIsWeightInputEmptyString(
                    new Array(numberOfSets).fill(isWeightInputEmptyString[0])
                  );
                }
                setSameWeightForEachSet(newSameWeightForEachSet);
              }}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <div className="ml-3 text-sm">
            <label
              htmlFor="sameWeightForEachSet"
              className="font-medium text-gray-700"
            >
              Same Weight for Each Set
            </label>
          </div>
        </div>
        {sameRepsForEachSet && (
          <div className="">
            <label
              htmlFor="reps"
              className="block text-sm font-medium text-gray-700"
            >
              Assigned Reps
            </label>
            <div className="mt-1">
              <input
                required
                type="number"
                min="0"
                max="20"
                value={numberOfReps}
                onInput={(e) => setNumberOfReps([Number(e.target.value)])}
                name="reps"
                id="reps"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500" id="email-description">
              (0 for AMRAP)
            </p>
          </div>
        )}
        {!sameRepsForEachSet &&
          new Array(numberOfSets).fill(1).map((_, index) => (
            <div className="" key={index}>
              <label
                htmlFor={`reps-${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Assigned Reps #{index + 1}
              </label>
              <div className="mt-1">
                <input
                  required
                  type="number"
                  min="0"
                  max="20"
                  value={numberOfReps[index]}
                  onInput={(e) => {
                    const newNumberOfReps = numberOfReps.slice();
                    newNumberOfReps[index] = Number(e.target.value);
                    setNumberOfReps(newNumberOfReps);
                  }}
                  name={`reps-${index}`}
                  id={`reps-${index}`}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500" id="email-description">
                (0 for AMRAP)
              </p>
            </div>
          ))}
        {sameWeightForEachSet && (
          <div className="col-start-1">
            <label
              htmlFor="weight"
              className="block text-sm font-medium text-gray-700"
            >
              Assigned Weight
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <input
                required
                type="number"
                min="0"
                name="weight"
                id="weight"
                className="hide-arrows block w-full rounded-md border-gray-300 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={
                  isWeightInputEmptyString[0]
                    ? ""
                    : isUsingKilograms
                    ? weightKilograms[0]
                    : weightPounds[0]
                }
                placeholder={0}
                onInput={(e) => {
                  setIsWeightInputEmptyString([e.target.value === ""]);
                  const weight = Number(e.target.value);
                  if (isUsingKilograms) {
                    setWeightKilograms([weight]);
                    setWeightPounds([Math.round(kilogramsToPounds(weight))]);
                  } else {
                    setWeightPounds([weight]);
                    setWeightKilograms([Math.round(poundsToKilograms(weight))]);
                  }
                }}
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <label htmlFor="weight-type" className="sr-only">
                  weight type
                </label>
                <select
                  id="weight-type"
                  name="weight-type"
                  className="h-full rounded-md border-transparent bg-transparent py-0 pl-2 pr-7 text-gray-500 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  onChange={(e) => setIsUsingKilograms(e.target.value === "kg")}
                  value={isUsingKilograms ? "kg" : "lbs"}
                >
                  <option>kg</option>
                  <option>lbs</option>
                </select>
              </div>
            </div>
          </div>
        )}
        {!sameWeightForEachSet &&
          new Array(numberOfSets).fill(1).map((_, index) => (
            <div key={index} className={index === 0 ? "col-start-1" : ""}>
              <label
                htmlFor={`weight-${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Assigned Weight #{index + 1}
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <input
                  required
                  type="number"
                  min="0"
                  name={`weight-${index}`}
                  id={`weight-${index}`}
                  className="hide-arrows block w-full rounded-md border-gray-300 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={
                    isWeightInputEmptyString[index]
                      ? ""
                      : isUsingKilograms
                      ? weightKilograms[index]
                      : weightPounds[index]
                  }
                  placeholder={0}
                  onInput={(e) => {
                    const newIsWeightInputEmptyString =
                      isWeightInputEmptyString.slice();
                    newIsWeightInputEmptyString[index] = e.target.value === "";
                    setIsWeightInputEmptyString(newIsWeightInputEmptyString);

                    const weight = Number(e.target.value);
                    const newWeightKilograms = weightKilograms.slice();
                    const newWeightPounds = weightPounds.slice();
                    if (isUsingKilograms) {
                      newWeightKilograms[index] = weight;
                      newWeightPounds[index] = Math.round(
                        kilogramsToPounds(weight)
                      );
                    } else {
                      newWeightPounds[index] = weight;
                      newWeightKilograms[index] = Math.round(
                        poundsToKilograms(weight)
                      );
                    }
                    setWeightKilograms(newWeightKilograms);
                    setWeightPounds(newWeightPounds);
                  }}
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <label htmlFor={`weight-type-${index}`} className="sr-only">
                    weight type
                  </label>
                  <select
                    id={`weight-type-${index}`}
                    name={`weight-type-${index}`}
                    className="h-full rounded-md border-transparent bg-transparent py-0 pl-2 pr-7 text-gray-500 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    onChange={(e) =>
                      setIsUsingKilograms(e.target.value === "kg")
                    }
                    value={isUsingKilograms ? "kg" : "lbs"}
                  >
                    <option>kg</option>
                    <option>lbs</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        {selectedExercise && <hr className="w-full border sm:col-span-3"></hr>}
        {selectedExercise && (
          <div className="col-start-1">
            <label
              htmlFor="setsPerformed"
              className="block text-sm font-medium text-gray-700"
            >
              Sets Performed
            </label>
            <div className="mt-1">
              <input
                required
                type="number"
                min="0"
                max="20"
                value={numberOfSetsPerformed}
                onInput={(e) =>
                  setNumberOfSetsPerformed(Number(e.target.value))
                }
                name="setsPerformed"
                id="setsPerformed"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
        )}
        {selectedExercise &&
          new Array(numberOfSetsPerformed).fill(1).map((_, index) => (
            <div className={index === 0 ? "col-start-1" : ""} key={index}>
              <label
                htmlFor={`reps-performed-${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Reps Performed #{index + 1}
              </label>
              <div className="mt-1">
                <input
                  required
                  type="number"
                  min="0"
                  max="20"
                  value={numberOfRepsPerformed[index]}
                  onInput={(e) => {
                    const newNumberOfRepsPerformed =
                      numberOfRepsPerformed.slice();
                    newNumberOfRepsPerformed[index] = Number(e.target.value);
                    setNumberOfRepsPerformed(newNumberOfRepsPerformed);
                  }}
                  name={`reps-performed-${index}`}
                  id={`reps-performed-${index}`}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          ))}
        {selectedExercise &&
          new Array(numberOfSetsPerformed).fill(1).map((_, index) => (
            <div key={index} className={index === 0 ? "col-start-1" : ""}>
              <label
                htmlFor={`weight-performed-${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Weight Performed #{index + 1}
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <input
                  required
                  type="number"
                  min="0"
                  name={`weight-performed-${index}`}
                  id={`weight-performed-${index}`}
                  className="hide-arrows block w-full rounded-md border-gray-300 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={
                    isWeightInputEmptyString[index]
                      ? ""
                      : isUsingKilograms
                      ? weightKilograms[index]
                      : weightPounds[index]
                  }
                  placeholder={0}
                  onInput={(e) => {
                    const newIsWeightInputEmptyString =
                      isWeightInputEmptyString.slice();
                    newIsWeightInputEmptyString[index] = e.target.value === "";
                    setIsWeightInputEmptyString(newIsWeightInputEmptyString);

                    const weight = Number(e.target.value);
                    const newWeightKilograms = weightKilograms.slice();
                    const newWeightPounds = weightPounds.slice();
                    if (isUsingKilograms) {
                      newWeightKilograms[index] = weight;
                      newWeightPounds[index] = Math.round(
                        kilogramsToPounds(weight)
                      );
                    } else {
                      newWeightPounds[index] = weight;
                      newWeightKilograms[index] = Math.round(
                        poundsToKilograms(weight)
                      );
                    }
                    setWeightKilograms(newWeightKilograms);
                    setWeightPounds(newWeightPounds);
                  }}
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <label
                    htmlFor={`weight-type-performed-${index}`}
                    className="sr-only"
                  >
                    weight type
                  </label>
                  <select
                    id={`weight-type-performed-${index}`}
                    name={`weight-type-performed-${index}`}
                    className="h-full rounded-md border-transparent bg-transparent py-0 pl-2 pr-7 text-gray-500 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={isUsingKilograms ? "kg" : "lbs"}
                    disabled
                  >
                    <option>kg</option>
                    <option>lbs</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
      </form>
    </Modal>
  );
}
